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
        logger.info(`page ${this.name}loaded`, this);
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
            }
            /**
             * it is possible that some parent field is also sent along with key fields.
             * in such a case, it is update if all fields are recd.
             */
            this.saveIsUpdate = this.fc.hasKeyValues();
        }
        /**
         * any global init function ?
         */
        this.ac.pageLoaded(this);
        if (this.page.onLoadActions) {
            if (this.page.inputIsForUpdate && inputNames.length === 0) {
                // onload is meant only for update mode. onload not triggered if this is not for update but "save" or "new"
            }
            else {
                for (const actionName of this.page.onLoadActions) {
                    console.info(`Onload action ${actionName} being initiated`);
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
            const control = this.fc.getChild(btn.name);
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
        const reqAt = new Date().getTime();
        const resp = await this.ac.serve(serviceName, data);
        const respAt = new Date().getTime();
        logger.info(`Service '${serviceName}' returned after  ${respAt - reqAt}ms`),
            resp;
        if (disableUx) {
            //enable ux now
        }
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
        const completedAt = new Date().getTime();
        logger.info(`It took ${completedAt - respAt}ms to render the data received from the service '${serviceName}' `);
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
            case 'close':
                //todo: any checks and balances?'
                this.ac.navigate({ closePage: true });
                break;
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
            // we should not mutate the action
            if (newParams) {
                const newAction = { ...action };
                newAction.params = newParams;
                action = newAction;
            }
        }
        if (action.retainCurrentPage) {
            if (!action.menuItem) {
                addMessage(`Action ${action.name} requires that the current page be retained,
            but does not specify the menu item to be used to open a new page`, p.msgs);
                return false;
            }
            if (action.module) {
                addMessage(`Action ${action.name} requires that the current page be retained.
            It should not specify moduleName in this case. current module assumed`, p.msgs);
                return false;
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
        let filters;
        if (action.filterFields) {
            filters = getConditions(fc.getData(), action.filterFields, messages);
        }
        else {
            filters = toFilters(fc.getData());
        }
        if (filters) {
            vo.filters = filters;
        }
        return vo;
    }
}
exports.PC = PC;
/**
 * //TODO we have to validate the fields
 * @param values
 * @returns
 */
function toFilters(values) {
    const filters = [];
    for (const [field, value] of Object.entries(values)) {
        if (value) {
            filters.push({ field, value: '' + value, comparator: '=' });
        }
    }
    if (filters.length) {
        return filters;
    }
    return undefined;
}
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