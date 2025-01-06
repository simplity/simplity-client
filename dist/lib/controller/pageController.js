"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PC = void 0;
const logger_1 = require("../logger-stub/logger");
const formController_1 = require("./formController");
const app_1 = require("./app");
const logger = logger_1.loggerStub.getLogger();
const FORM_NAME = 'ROOT';
class PC {
    constructor(pageView) {
        this.buttonsToDisplay = [];
        /**
         * is this page for saving data? (for add or update depending on the mode)
         */
        this.forSave = false;
        /**
         * relevant if forSave is true.
         * true if the page is invoked with keys, and hence we are updating
         */
        this.saveIsUpdate = false;
        /**
         * set to true if user changes any field value
         */
        this.isModified = false;
        /**
         * values that are set at run time at the page-context.
         * this context is checked for preparing the payload using params.
         */
        this.values = {};
        /**
         * runtime actions are triggered by view components that may be created at run time, needing onclick-action.
         */
        this.functions = {};
        this.actions = {};
        this.lists = {};
        this.ac = app_1.app.getCurrentAc();
        this.pageView = pageView;
        this.page = pageView.page;
        /**
         * we make a copy of actions because we may add actions dynamically
         */
        if (this.page.actions) {
            this.actions = { ...this.page.actions };
        }
        this.name = this.page.name;
        let form = undefined;
        let formName = this.page.formName;
        if (formName) {
            form = this.ac.getForm(formName);
        }
        this.fc = new formController_1.FC(FORM_NAME, this, form);
    }
    pageRendered() {
        this.fc.formRendered();
        //we may have to enable/disable buttons
        this.setButtonDisplays(this.page.leftButtons);
        this.setButtonDisplays(this.page.rightButtons);
        this.setButtonDisplays(this.page.middleButtons);
    }
    pageLoaded() {
        logger.info('page loaded', this);
        /**
         * do we have input data for this page?
         */
        const expectedInputs = this.page.inputs;
        const inputNames = [];
        const inputValues = {};
        if (expectedInputs) {
            /**
             * assign input parameters into the page
             */
            const inp = this.pageView.params || {};
            for (const [key, isRequired] of Object.entries(expectedInputs)) {
                const val = inp[key];
                if (val !== undefined) {
                    inputValues[key] = val;
                    inputNames.push(key);
                }
                else if (isRequired && !this.page.inputIsForUpdate) {
                    throw new Error(`Input value missing for parameter ${key} for page ${this.name}`);
                }
            }
        }
        if (inputNames.length) {
            this.fc.setData(inputValues);
            if (this.page.inputIsForUpdate) {
                this.forSave = true;
                this.fc.setDisplay(inputNames, { isHidden: true });
                /**
                 * it is possible that some parent field is also sent along with key fields.
                 * in such a case, it is update if all fields are recd.
                 */
                this.saveIsUpdate = this.fc.hasKeyValues();
            }
        }
        if (this.page.onLoadActions) {
            if (this.page.inputIsForUpdate && inputNames.length === 0) {
                // onload is meant only for update mode. onload not triggered if this is not for update but "save" or "new"
            }
            else {
                for (const actionName of this.page.onLoadActions) {
                    this.act(actionName, this.fc, undefined);
                }
            }
        }
        this.checkTitle();
    }
    getFormController() {
        return this.fc;
    }
    setVariable(name, value) {
        this.values[name] = value;
    }
    getVariable(name) {
        return this.values[name];
    }
    setModifiedStatus(isModified) {
        this.isModified = isModified;
    }
    isValid() {
        return this.fc.isValid();
    }
    showAlerts(alerts) {
        if (alerts.length) {
            this.pageView.alert(alerts);
        }
    }
    /**
     *
     * @param messages
     */
    showMessages(messages) {
        if (!messages.length) {
            return;
        }
        const alerts = [];
        for (let msg of messages) {
            let text = msg.text;
            if (msg.id) {
                text = this.ac.getMessage(msg.id, msg.params) || text;
            }
            alerts.push({ type: msg.type, text });
        }
        this.showAlerts(alerts);
    }
    enableUx() {
        this.pageView.enableUx();
    }
    disableUx() {
        this.pageView.disableUx();
    }
    getList(control, key) {
        const listName = control.field.listName;
        if (!listName) {
            logger.warn(`Control ${control.name} does not have listName, but a list is requested for it. Request ignored`);
            return;
        }
        let localList = this.lists[listName];
        if (localList) {
            const isSimple = Array.isArray(localList);
            let list = [];
            if (isSimple) {
                list = localList;
            }
            else {
                if (key !== undefined) {
                    list = localList[key] || [];
                }
                else {
                    logger.error(`List ${listName} is a keyed list but no key value is specified while requesting this list for control "${control.name}" `);
                }
            }
            control.setList(list);
            return;
        }
        this.ac.getList(listName, false, key).then((list) => {
            control.setList(list);
        });
    }
    getServiceName(formName, operation, messages) {
        if (!formName) {
            addMessage(`Form controller ${this.name} is not associated with a form. Can not do form based service`, messages);
            return '';
        }
        const form = this.ac.getForm(formName);
        const ops = form.operations;
        if (!ops) {
            addMessage(`Form controller ${this.name} is not associated with a form. Can not do form based service`, messages);
            return '';
        }
        if (!form.serveGuests) {
            if (!this.ac.getUser()) {
                addMessage(`User needs to login for this operation`, messages);
                return '';
            }
        }
        if (!ops[operation]) {
            addMessage(`${operation} is not allowed on the form ${this.name}`, messages);
            return '';
        }
        return operation + '_' + form.name;
    }
    requestGet(controller, toDisableUx, params, callback) {
        const msgs = [];
        let data;
        let serviceName = this.getServiceName(controller.getFormName(), 'get', msgs);
        if (serviceName && params) {
            data = controller.extractData(params, msgs);
        }
        if (msgs.length) {
            this.showMessages(msgs);
            if (callback) {
                callback(false);
            }
            return;
        }
        this.serve(serviceName, toDisableUx, controller, data).then((ok) => {
            if (callback) {
                callback(ok);
            }
        });
    }
    requestSave(saveOperation, controller, toDisableUx, callback) {
        const msgs = [];
        const serviceName = this.getServiceName(controller.getFormName(), saveOperation, msgs);
        if (serviceName) {
            if (this.isValid() === false) {
                addMessage('Page has fields with errors.', msgs);
            }
            if (saveOperation === 'save') {
                if (!this.forSave) {
                    addMessage('This page is not designed for a save operation', msgs);
                }
                else {
                    saveOperation = this.saveIsUpdate ? 'update' : 'create';
                }
            }
        }
        if (msgs.length) {
            this.showMessages(msgs);
            if (callback) {
                callback(false);
            }
            return;
        }
        const data = controller.getData();
        this.serve(serviceName, toDisableUx, controller, data).then((ok) => {
            if (callback) {
                callback(ok);
            }
        });
    }
    requestService(serviceName, options) {
        if (!options) {
            options = {};
        }
        const controller = options.fc || this.fc;
        if (options.toDisableUx) {
            //disable ux now
        }
        this.ac.serve(serviceName, options.payload).then((resp) => {
            if (options.toDisableUx) {
                //enable ux now
            }
            logger.info(`Service ${serviceName} returned.`, resp);
            //we have to show messages
            if (resp.messages) {
                this.showMessages(resp.messages);
            }
            if (resp.status !== 'completed') {
                return;
            }
            const data = resp.data || {};
            if (options.callback) {
                options.callback(data);
            }
            else {
                controller.receiveData(data, options.targetPanelName);
            }
        });
    }
    act(actionName, controller, params) {
        /**
         * run time actions override design time actions.
         * Also, run time action is just a function, and has no feature for "before" or "after" action
         */
        const fn = this.functions[actionName];
        if (fn) {
            fn();
            return;
        }
        const ap = {
            params,
            msgs: [],
            fc: controller || this.fc,
            activeActions: {},
        };
        /**
         * actions may trigger other actions that may lead to infinite-loops.
         * we treat recursive call to the  same action as an infinite-loop.
         */
        this.doAct(actionName, ap);
    }
    addAction(action) {
        const name = action.name;
        if (this.actions[name]) {
            logger.warn(`Action "${name}" overrides as existing action`);
        }
        this.actions[name] = action;
    }
    addList(name, list) {
        this.lists[name] = list;
    }
    addFunction(name, fn) {
        this.functions[name] = fn;
    }
    callFunction(name, params, msgs, controller) {
        const entry = this.ac.getFn(name);
        const status = { allOk: false };
        if (!msgs) {
            msgs = [];
        }
        if (!entry) {
            addMessage(`function ${name} is not defined but is being requested`, msgs);
            return status;
        }
        let ret = undefined;
        const fnType = entry.type;
        try {
            status.allOk = true;
            switch (fnType) {
                case 'form':
                    if (controller) {
                        ret = entry.fn(controller, params, msgs);
                    }
                    else {
                        logger.warn(`function ${name} is of type "form" but is invoked with no data-controller. Root dc is assumed.`);
                        ret = entry.fn(this.fc, params, msgs);
                    }
                    break;
                case 'global':
                    ret = entry.fn(this.ac, params, msgs);
                    break;
                case 'page':
                    ret = entry.fn(this, params, msgs);
                    break;
                case 'value':
                    logger.warn(`function ${name} is a validation function, but is being called in a non-validation context in page ${this.name}`);
                    ret = entry.fn(params);
                    break;
                case 'request':
                case 'response':
                    addMessage(`function ${name} is defined with type="${fnType}".  It should not be invoked on its own. (It is used internally by the page controller with a serviceAction with which this function may be associated.)`, msgs);
                    break;
                default:
                    addMessage(`function ${name} is defined with type="${fnType}", but this type of function is not yet implemented.`, msgs);
                    break;
            }
        }
        catch (e) {
            const msg = e.message;
            addMessage(`Error while calling function ${name}: ${msg} `, msgs);
            status.allOk = false;
        }
        status.returnedValue = ret;
        return status;
    }
    setButtonDisplays(buttons) {
        if (!buttons) {
            return;
        }
        for (const btn of buttons) {
            const enable = btn.enableWhen;
            if (!enable) {
                continue;
            }
            const control = this.fc.getChildView(btn.name);
            if (!control) {
                continue;
            }
            this.buttonsToDisplay.push({
                button: control,
                show: enable === 'valid',
            });
        }
    }
    checkTitle() {
        let title = this.page.titlePrefix || '';
        if (this.page.titleField) {
            const val = this.fc.getFieldValue(this.page.titleField) || '  ';
            title += val; // it will come later?
        }
        if (this.page.titleSuffix) {
            title += this.page.titleSuffix;
        }
        if (title !== this.currentTitle) {
            this.currentTitle = title;
            this.ac.setPageTitle(title);
        }
    }
    async serve(serviceName, disableUx, fc, data, targetChild, onResponseFn) {
        if (targetChild) {
            if (!fc.getController(targetChild)) {
                const text = `Service ${serviceName} is requested with a target table="${targetChild}", but no table is available with that name. service not requested.`;
                logger.error(text);
                this.showMessages([{ id: 'noTable', text, type: 'error' }]);
                return false;
            }
        }
        if (disableUx) {
            //disable ux now
        }
        const resp = await this.ac.serve(serviceName, data);
        if (disableUx) {
            //enable ux now
        }
        logger.info(`Service ${serviceName} returned.`, resp);
        if (onResponseFn) {
            logger.info(`Function ${onResponseFn} invoked to process the response`);
            const fnd = this.ac.getFn(onResponseFn, 'response');
            const fn = fnd.fn;
            fn(this, resp);
        }
        //we have to show messages
        if (resp.messages) {
            this.showMessages(resp.messages);
        }
        if (resp.status !== 'completed') {
            return false;
        }
        if (resp.data) {
            fc.receiveData(resp.data, targetChild);
        }
        return true;
    }
    /**
     * IMP: code within this class must call this, and not the public method
     * actions can be chained with onSuccess and inFailure.
     * This may lead to infinite loops.
     * This is designed to detect any such loop and throw error, rather than getting a activeActions-over-flow
     * @param action
     * @param fd form data controller
     * @param params
     * @param activeActions
     */
    doAct(actionName, p) {
        let action = this.actions[actionName];
        let errorFound = false;
        const controller = p.fc || this.fc;
        if (!action) {
            addMessage(`${actionName} is not defined as an action on this page but is requested by a component.`, p.msgs);
            errorFound = true;
        }
        else if (p.activeActions[actionName]) {
            addMessage(`Action ${actionName} has onSuccess and/or onFailure that is resulting in a circular relationship.
            This may result in an infinite loop,and hence is not allowed`, p.msgs);
            errorFound = true;
        }
        if (errorFound || !action) {
            this.actionReturned(undefined, false, p);
            return;
        }
        p.activeActions[actionName] = true;
        switch (action.type) {
            case 'function':
                const functionName = action.functionName;
                /**
                 * is it a dynamic function added at run time for this page?
                 */
                const fn = this.functions[functionName];
                if (fn) {
                    fn();
                    break;
                }
                const status = this.callFunction(functionName, p.params, p.msgs, controller);
                errorFound = !status.allOk;
                break;
            case 'form':
                //request the form action as an async, chain the call back, and return.
                this.doFormAction(action, p, (ok) => {
                    this.actionReturned(action, ok, p);
                });
                return;
            case 'navigation':
                errorFound = this.navigate(action, p) === false;
                break;
            case 'service':
                const a = action;
                let values;
                if (a.submitAllData || a.panelToSubmit) {
                    let controllerToUse;
                    if (a.submitAllData) {
                        controllerToUse = this.fc;
                    }
                    else {
                        controllerToUse = this.fc.searchChildController(a.panelToSubmit);
                    }
                    if (!controllerToUse) {
                        throw new Error(`Design Error. Action '${a.name}' on page '${this.name}' specifies panelToSubmit='${a.panelToSubmit}' but that form is not used on this page `);
                    }
                    //let us validate the form again
                    if (controllerToUse.validate()) {
                        values = controllerToUse.getData();
                        console.info('values are ready:', values);
                        console.info(this);
                    }
                    else {
                        addMessage('Please fix the errors on this page', p.msgs);
                        errorFound = true;
                    }
                }
                else if (a.params) {
                    const n = p.msgs.length;
                    values = controller.extractData(a.params, p.msgs);
                    errorFound = n !== p.msgs.length;
                }
                /**
                 * do we have an intercept?
                 */
                if (!errorFound && a.fnBeforeRequest) {
                    const fnd = this.ac.getFn(a.fnBeforeRequest, 'request');
                    const fn = fnd.fn;
                    const ok = fn(controller, values, p.msgs);
                    errorFound = !ok;
                }
                if (errorFound) {
                    break;
                }
                /**
                 * ok. ask for the service.
                 */
                this.serve(a.serviceName, a.toDisableUx || false, controller, values, a.targetPanelName, a.fnAfterResponse).then((ok) => {
                    this.actionReturned(action, ok, p);
                });
                return;
            default:
                addMessage(`${action.type} is an invalid action-type specified in action ${actionName}`, p.msgs);
                action = undefined; //so that we stop this chain..
                errorFound = true;
                break;
        }
        this.actionReturned(action, !errorFound, p);
    }
    /**
     * an async action has returned. We have to continue the possible action-chain
     * @param action
     * @param ok //if the action succeeded
     * @param activeActions
     */
    actionReturned(action, ok, p) {
        this.showMessages(p.msgs);
        if (!action) {
            return;
        }
        //call back action??
        if (ok) {
            if (action.onSuccess) {
                //this chain continues..
                this.doAct(action.onSuccess, p);
            }
        }
        else if (action.onFailure) {
            //this chain continues..
            this.doAct(action.onFailure, p);
        }
    }
    navigate(action, p) {
        /**
         * action may have parameterized values.
         * action is a meta data, and hence we are not to mutate it.
         * hence, if required, we clone this action with the substituted values
         */
        if (action.params) {
            const newParams = substituteParams(action.params, p.params || this.fc.getData());
            if (newParams) {
                const newAction = {};
                for (const a of Object.keys(action)) {
                    newAction[a] = action[a];
                }
                newAction.params = newParams;
                action = newAction;
            }
        }
        if (action.retainCurrentPage) {
            if (!action.menuName) {
                addMessage(`Action ${action.name} requires that the current page be retained,
            but does not specify the menu item to be used to open a new page`, p.msgs);
                return false;
            }
            if (action.module) {
                logger.warn(`Action ${action.name} requires that the current page be retained.
            It should not specify moduleName in this case. current main menu assumed`);
            }
            this.ac.navigate(action);
            return true;
        }
        /**
         * we are to close this page
         */
        if (action.warnIfModified && this.isModified) {
            /**
             * TODO: use message service for this
             */
            if (window.confirm('Click on Okay to abandon any changes you would have made. Cancel to get back to editing ')) {
                return true;
            }
        }
        const closeAction = this.page.onCloseAction;
        if (!closeAction) {
            this.ac.navigate(action);
            return true;
        }
        const tr = this.actions[closeAction];
        if (!tr || tr.type === 'navigation') {
            addMessage(`${closeAction} is specified as close-action for this page.
          This action is not defined, or it is defined as a navigation action.`, p.msgs);
            return false;
        }
        this.act(closeAction, undefined);
        const ac = this.ac;
        window.setTimeout(() => {
            ac.navigate(action);
        }, 0);
        return true;
    }
    doFormAction(action, actionParams, callback) {
        const fc = actionParams.fc || this.fc;
        const messages = [];
        let operation = action.formOperation;
        if (operation === 'save') {
            if (!this.forSave) {
                addMessage('This page is not designed for a save operation', messages);
            }
            else {
                operation = this.saveIsUpdate ? 'update' : 'create';
            }
        }
        const serviceName = this.getServiceName(fc.getFormName(), action.formOperation, messages);
        if (messages.length) {
            this.showMessages(messages);
            callback(false);
            return;
        }
        let data;
        let targetChild;
        switch (action.formOperation) {
            case 'get':
                data = fc.extractKeys(messages);
                break;
            case 'filter':
                const fa = action;
                data = this.getFilterData(fc, fa, messages);
                targetChild = fa.childName;
                break;
            case 'create':
            case 'update':
            case 'delete':
            case 'save':
                if (!this.isValid()) {
                    addMessage('Page has fields with errors.', messages);
                    break;
                }
                data = fc.getData();
                break;
            default:
                addMessage(`Form operation ${action.formOperation} is not valid`, actionParams.msgs);
                callback(false);
                return;
        }
        if (messages.length) {
            this.showMessages(messages);
            callback(false);
            return;
        }
        this.serve(serviceName, !!action.toDisableUx, fc, data, targetChild, undefined).then((ok) => {
            if (callback) {
                callback(ok);
            }
        });
    }
    getFilterData(fc, action, messages) {
        const vo = {};
        if (action.sortBy) {
            vo.sorts = action.sortBy;
        }
        if (action.fields) {
            vo.fields = action.fields;
        }
        if (action.maxRows) {
            vo.maxRows = action.maxRows;
        }
        if (action.filterParams) {
            const filters = getConditions(fc.getData(), action.filterParams, messages);
            if (filters) {
                vo.filters = filters;
            }
        }
        return vo;
    }
}
exports.PC = PC;
function addMessage(text, msgs) {
    msgs.push({ text, id: '', type: 'error' });
}
function getConditions(rootData, params, msgs) {
    const filters = [];
    if (!params) {
        return filters;
    }
    for (const [field, param] of Object.entries(params)) {
        const val = rootData[field];
        if (!val) {
            if (param.isRequired) {
                addMessage(`value missing for parameter ${field}. fetch action will abort.`, msgs);
                return undefined;
            }
            continue;
        }
        const filter = {
            field,
            comparator: param.comparator,
            value: val,
        };
        if (param.comparator === '><') {
            const toField = param.toField;
            if (toField) {
                filter.toValue = rootData[toField];
            }
            else {
                addMessage(`toField not specified for for field ${field} for its >< operation. filter action will abort.`, msgs);
                return undefined;
            }
        }
        filters.push(filter);
    }
    return filters;
}
function substituteParams(params, data) {
    /**
     * copy params, after substitution if required
     */
    const props = {};
    let altered = false;
    for (const key of Object.keys(params)) {
        const val = params[key].toString();
        // var:'$fieldName and not var: $$23.0 are to be substituted
        if (val && val.charAt(0) === '$' && val.charAt(1) !== '$') {
            const fieldName = val.substring(1);
            const fieldValue = data[fieldName];
            if (!fieldValue && fieldValue !== 0) {
                logger.warn(`Parameter ${fieldName} has no value while invoking an action that uses this parameter`);
            }
            props[key] = fieldValue;
            altered = true;
        }
        else {
            props[key] = val;
        }
    }
    if (altered) {
        return props;
    }
    return undefined;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFnZUNvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2NvbnRyb2xsZXIvcGFnZUNvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsa0RBQW1EO0FBdUNuRCxxREFBc0M7QUFDdEMsK0JBQTRCO0FBVzVCLE1BQU0sTUFBTSxHQUFHLG1CQUFVLENBQUMsU0FBUyxFQUFFLENBQUM7QUFDdEMsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDO0FBQ3pCLE1BQWEsRUFBRTtJQTBEYixZQUFtQixRQUFrQjtRQXpDcEIscUJBQWdCLEdBRzNCLEVBQUUsQ0FBQztRQUVUOztXQUVHO1FBQ0ssWUFBTyxHQUFHLEtBQUssQ0FBQztRQUN4Qjs7O1dBR0c7UUFDSyxpQkFBWSxHQUFHLEtBQUssQ0FBQztRQVU3Qjs7V0FFRztRQUNLLGVBQVUsR0FBRyxLQUFLLENBQUM7UUFFM0I7OztXQUdHO1FBQ0ssV0FBTSxHQUE2QixFQUFFLENBQUM7UUFFOUM7O1dBRUc7UUFDYyxjQUFTLEdBQTZCLEVBQUUsQ0FBQztRQUN6QyxZQUFPLEdBQXNCLEVBQUUsQ0FBQztRQUNoQyxVQUFLLEdBQXNDLEVBQUUsQ0FBQztRQUc3RCxJQUFJLENBQUMsRUFBRSxHQUFHLFNBQUcsQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUM3QixJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztRQUN6QixJQUFJLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUM7UUFDMUI7O1dBRUc7UUFDSCxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDdEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMxQyxDQUFDO1FBQ0QsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztRQUUzQixJ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