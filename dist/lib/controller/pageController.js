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
        this.ac.showAlerts(alerts);
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
            this.ac.disableUx();
        }
        this.ac.serve(serviceName, options.payload, false).then((resp) => {
            logger.info(`Service ${serviceName} returned.`, resp);
            //we have to show messages
            if (resp.messages) {
                this.showMessages(resp.messages);
            }
            const ok = resp.status === 'completed';
            if (ok) {
                const data = resp.data || {};
                if (options.callback) {
                    options.callback(data);
                }
                else {
                    controller.receiveData(data, options.targetPanelName);
                }
            }
            if (options.toDisableUx || true) {
                this.ac.enableUx();
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
            this.ac.disableUx();
        }
        const reqAt = new Date().getTime();
        const resp = await this.ac.serve(serviceName, data, false); //we are handling disabling ux
        const respAt = new Date().getTime();
        logger.info(`Service '${serviceName}' returned after  ${respAt - reqAt}ms`, resp);
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
        const ok = resp.status === 'completed';
        if (ok) {
            if (resp.data) {
                fc.receiveData(resp.data, targetChild);
            }
            const completedAt = new Date().getTime();
            logger.info(`It took ${completedAt - respAt}ms to render the data received from the service '${serviceName}' `);
        }
        if (disableUx) {
            this.ac.enableUx();
        }
        return ok;
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
                this.serve(a.serviceName, !!a.toDisableUx, controller, values, a.targetPanelName, a.fnAfterResponse).then((ok) => {
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