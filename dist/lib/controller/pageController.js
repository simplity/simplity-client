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
            addMessage(`Form ${form.name} is not designed for any form operation. Can not do form based service`, messages);
            return '';
        }
        if (!form.serveGuests) {
            if (!this.ac.getUser()) {
                addMessage(`User needs to login for this operation`, messages);
                return '';
            }
        }
        if (!ops[operation]) {
            addMessage(`operation '${operation}' is not allowed on the form ${this.name}`, messages);
            return '';
        }
        return operation + '_' + form.name;
    }
    requestGet(controller, params, callback) {
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
        this.serve(serviceName, controller, data).then((ok) => {
            if (callback) {
                callback(ok);
            }
        });
    }
    requestSave(saveOperation, controller, callback) {
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
        this.serve(serviceName, controller, data).then((ok) => {
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
        });
    }
    takeAction(action, controller, params) {
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
        this.doAct(action.name, ap, action);
    }
    act(actionName, controller, params) {
        /**
         * run time functions override design time actions.
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
    async serve(serviceName, fc, data, targetChild, onResponseFn) {
        if (targetChild) {
            if (!fc.getController(targetChild)) {
                const text = `Service ${serviceName} is requested with a target table="${targetChild}", but no table is available with that name. service not requested.`;
                logger.error(text);
                this.showMessages([{ id: 'noTable', text, type: 'error' }]);
                return false;
            }
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
    doAct(actionName, p, action) {
        if (!action) {
            action = this.actions[actionName];
            //several actions have params. Hence this lint command
            //merge params. run-time must override design-time in case of a clash
            if (action) {
                //@ts-expect-error
                const ap = action.params;
                if (ap) {
                    if (p.params) {
                        p.params = { ...ap, ...p.params };
                    }
                    else {
                        p.params = ap;
                    }
                }
            }
        }
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
        if (action.toDisableUx) {
            this.ac.disableUx();
        }
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
                this.serve(a.serviceName, controller, values, a.targetPanelName, a.fnAfterResponse).then((ok) => {
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
        if (action.toDisableUx) {
            this.ac.enableUx();
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
        const serviceName = this.getServiceName(action.formName || fc.getFormName(), action.formOperation, messages);
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
        this.serve(serviceName, fc, data, targetChild, undefined).then((ok) => {
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
function getConditions(rootData, filterFields, msgs) {
    const filters = [];
    if (!filterFields) {
        return filters;
    }
    for (const [field, con] of Object.entries(filterFields)) {
        if (con.comparator === '!#' || con.comparator === '#') {
            filters.push({ field, comparator: con.comparator });
            continue;
        }
        let val = con.fieldValue;
        if (val === undefined) {
            val = rootData[field];
        }
        if (val === undefined || val === '') {
            if (con.isRequired) {
                addMessage(`value missing for parameter ${field}. Action will abort.`, msgs);
                return undefined;
            }
            continue;
        }
        const filter = {
            field,
            comparator: con.comparator,
            value: val,
        };
        if (con.comparator === '><') {
            let toValue = con.toFieldValue;
            if (toValue === undefined) {
                const toField = con.toField;
                if (!toField) {
                    addMessage(`toField not specified for for field ${field} for its >< operation. filter action will abort.`, msgs);
                    return undefined;
                }
                toValue = rootData[toField];
                if (toValue === undefined || val === '') {
                    if (con.isRequired) {
                        addMessage(`value missing for parameter ${toField} that is defined as the to-field for ${field}. Action will abort.`, msgs);
                        return undefined;
                    }
                    continue;
                }
            }
            filter.toValue = toValue;
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