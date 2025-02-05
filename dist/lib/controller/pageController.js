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
        const actionType = action.type;
        switch (actionType) {
            case 'close':
                //todo: any checks and balances?'
                this.ac.navigate({ closePage: true });
                break;
            case 'display':
                for (const [compName, settings] of Object.entries(action.displaySettings)) {
                    this.setDisplayState(compName, settings);
                }
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
                addMessage(`${actionType} is an invalid action-type specified in action ${actionName}`, p.msgs);
                action = undefined; //so that we stop this chain..
                errorFound = true;
                break;
        }
        this.actionReturned(action, !errorFound, p);
    }
    setDisplayState(compName, settings) {
        this.fc.setDisplayState(compName, settings);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFnZUNvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2NvbnRyb2xsZXIvcGFnZUNvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsa0RBQW1EO0FBd0NuRCxxREFBc0M7QUFDdEMsK0JBQTRCO0FBVzVCLE1BQU0sTUFBTSxHQUFHLG1CQUFVLENBQUMsU0FBUyxFQUFFLENBQUM7QUFDdEMsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDO0FBQ3pCLE1BQWEsRUFBRTtJQTBEYixZQUFtQixRQUFrQjtRQXpDcEIscUJBQWdCLEdBRzNCLEVBQUUsQ0FBQztRQUVUOztXQUVHO1FBQ0ssWUFBTyxHQUFHLEtBQUssQ0FBQztRQUN4Qjs7O1dBR0c7UUFDSyxpQkFBWSxHQUFHLEtBQUssQ0FBQztRQVU3Qjs7V0FFRztRQUNLLGVBQVUsR0FBRyxLQUFLLENBQUM7UUFFM0I7OztXQUdHO1FBQ0ssV0FBTSxHQUE2QixFQUFFLENBQUM7UUFFOUM7O1dBRUc7UUFDYyxjQUFTLEdBQTZCLEVBQUUsQ0FBQztRQUN6QyxZQUFPLEdBQXNCLEVBQUUsQ0FBQztRQUNoQyxVQUFLLEdBQXNDLEVBQUUsQ0FBQztRQUc3RCxJQUFJLENBQUMsRUFBRSxHQUFHLFNBQUcsQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUM3QixJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztRQUN6QixJQUFJLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUM7UUFDMUI7O1dBRUc7UUFDSCxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDdEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMxQyxDQUFDO1FBQ0QsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztRQUUzQixJ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