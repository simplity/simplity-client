"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FC = void 0;
const logger_1 = require("../logger-stub/logger");
const tableViewerController_1 = require("./tableViewerController");
const TableEditorController_1 = require("./TableEditorController");
const logger = logger_1.loggerStub.getLogger();
/**
 * controls a row in a table or the root fields in a page.
 */
class FC {
    /**
     * @param name unique across all elements of the parent. anything if this has no parent.
     * @param pc
     * @param form optional. form-based feature are available only if the form is not undefined
     * @param data optional. initial data with which the fields are to be rendered with
     */
    constructor(name, pc, form, data) {
        this.name = name;
        this.pc = pc;
        this.form = form;
        this.type = 'form';
        this.controllers = {};
        /**
         * all fields in this form.
         */
        this.fieldViews = {};
        /**
         * this is THE MODEL that this controller should control
         */
        this.data = {};
        /**
         * all the registered children
         */
        this.children = {};
        // {fieldName: {eventName: [handler1, handler2, ...] }}
        this.listeners = {};
        /**
         * set to true whenever a child reports a data-change
         */
        this.isDirty = true;
        /**
         * last known validation status. To be used only if isDirty is false;
         */
        this.allOk = false;
        this.ac = pc.ac;
        if (data) {
            this.data = data;
        }
    }
    getFormName() {
        return this.form ? this.form.name : undefined;
    }
    registerChild(view) {
        const name = view.name;
        if (this.children[name]) {
            console.error(`${name} is a duplicate child-name for the form "${this.name}. This may create unexpected behavior"`);
            return;
        }
        this.children[name] = view;
        const typ = view.comp.compType;
        if (typ === 'field') {
            this.fieldViews[name] = view;
        }
        else if (typ === 'panel') {
            if (view.comp.tabLabel !== undefined) {
                this.beginTab(name);
            }
        }
        else if (typ === 'tabs') {
            this.beginTabGroup(name);
        }
    }
    /**
     * tabbed  panel  has  individual
     * @param panelName
     */
    beginTabGroup(panelName) {
        if (this.currentGroupArray) {
            throw new Error(`Tabs group ${panelName} is inside another tab group. Embedded tabs are not supported.`);
        }
        if (!this.tabGroups) {
            this.tabGroups = {};
        }
        // get ready to register tab-child panels with editable fields
        this.currentGroupArray = [];
        this.tabGroups[panelName] = this.currentGroupArray;
    }
    /**
     *
     * @param panelName starting a new tab within tabs.
     * Get ready to receive fields into this tab.
     * @param comp
     */
    beginTab(panelName) {
        if (!this.currentGroupArray) {
            throw new Error(`${panelName} is a tab-child, but it is not inside a tab-group panel`);
        }
        if (this.currentTabArray) {
            throw new Error(`${panelName} is a tab-child, but it is inside of another tab-child. tab-child can only be direct children of child-group`);
        }
        /**
         * registerFields() would push editable fields into this array
         */
        this.currentTabArray = [];
        this.currentGroupArray.push(this.currentTabArray);
    }
    endOfTab() {
        this.currentTabArray = undefined;
    }
    endOfTabGroup() {
        this.currentTabArray = undefined;
        this.currentGroupArray = undefined;
    }
    formRendered() {
        for (const fieldView of Object.values(this.fieldViews)) {
            const field = fieldView.field;
            if (!field.listName) {
                continue;
            }
            if (field.listOptions) {
                logger.info(`Select-field ${field.name} has its listOptions set as well as listName. List name is ignored as the options are already made available `);
                continue;
            }
            /**
             * case 1: keyed-list but key is known at design time
             */
            if (field.listKeyValue) {
                this.pc.getList(fieldView, field.listKeyValue);
                continue;
            }
            /**
             * case 2: simple list
             */
            if (!field.listKeyFieldName) {
                this.pc.getList(fieldView);
                continue;
            }
            /**
             * case 3: keyed-list. key is another field
             */
            const keyControl = this.fieldViews[field.listKeyFieldName];
            if (!keyControl) {
                logger.error(`field ${field.name} uses ${field.listKeyFieldName} as its key-field for getting list of valid values. However the key field is not valid`);
                continue;
            }
            /**
             * wire the "change" event to get a keyed list for this drop-down-field
             */
            this.addEventListener(keyControl.name, 'change', (evt) => {
                const newValue = evt.newValue;
                console.log(`Triggering getList() for field '${field.name}' because field '${field.listKeyFieldName}' changed it's value to '${newValue}' `);
                /**
                 * empty list when key has no value,
                 */
                if (newValue === undefined ||
                    newValue === '' ||
                    evt.newValidity === false) {
                    console.log(`Triggering ${fieldView.name}.setList([])`);
                    fieldView.setList([]);
                    return;
                }
                let value;
                if (typeof newValue === 'number') {
                    value = newValue;
                }
                else {
                    value = newValue.toString();
                }
                console.log(`Triggering pc.getList([])`);
                this.pc.getList(fieldView, value);
            });
        }
        /**
         * all app-specific hook onFormRender
         */
        this.ac.formRendered(this);
    }
    getChildren() {
        return this.children;
    }
    newTableViewerController(view) {
        const name = view.name;
        this.checkName(name);
        const controller = new tableViewerController_1.TWC(this, view);
        this.controllers[name] = controller;
        return controller;
    }
    newTableEditorController(view) {
        const name = view.name;
        this.checkName(name);
        const controller = new TableEditorController_1.TEC(this, view);
        this.controllers[name] = controller;
        return controller;
    }
    newFormController(name, form, data) {
        this.checkName(name);
        const controller = new FC(name, this.pc, form, data);
        this.controllers[name] = controller;
        return controller;
    }
    getController(name) {
        return this.controllers[name];
    }
    searchChildController(name) {
        for (const [panelName, c] of Object.entries(this.controllers)) {
            if (panelName === name) {
                return c;
            }
            if (c.type === 'form') {
                const f = c.searchChildController(name);
                if (f) {
                    return f;
                }
            }
        }
        return undefined;
    }
    addEventListener(viewName, eventName, eventFn) {
        let viewListeners = this.listeners[viewName];
        if (!viewListeners) {
            viewListeners = {};
            this.listeners[viewName] = viewListeners;
        }
        let eventListeners = viewListeners[eventName];
        if (!eventListeners) {
            eventListeners = [];
            viewListeners[eventName] = eventListeners;
        }
        eventListeners.push(eventFn);
    }
    receiveData(vo, childName) {
        if (Array.isArray(vo)) {
            logger.error(`Form named ${this.name} should be receiving an object as data, but an array is received. Data ignored.`);
            return;
        }
        const data = vo;
        if (childName) {
            const controller = this.controllers[childName];
            if (!controller) {
                logger.error(`Form named ${this.name}:  ${childName} is not a child of this form, but data is received for the same. data ignored.`);
                return;
            }
            /**
             * is this a form or a table?
             */
            if (controller.type === 'form') {
                controller.setData(vo);
                return;
            }
            /**
             * this is data for a table/grid
             */
            const rows = data[childName] || data.list;
            if (!rows) {
                logger.error(`Data is received for the child "${childName}" but no data found with memberName="${childName}" or "list". Data ignored.`);
                return;
            }
            if (Array.isArray(rows)) {
                controller.receiveData(rows);
                return;
            }
            logger.error(`Data for child "${childName}" should be an array, but data received is of type ${typeof rows}. Data ignored.`);
            return;
        }
        /**
         * Ok. Data is for this form. It must be an object that has data for fields/sub-forms in this form
         */
        if (Array.isArray(data)) {
            logger.error(`An Array is being received as data for the form ${this.name}. It should be a Vo`);
            return;
        }
        this.data = data;
        for (const [name, fieldView] of Object.entries(this.fieldViews)) {
            let value = data[name];
            if (value === undefined) {
                value = '';
            }
            else if (typeof value === 'object') {
                console.error(`${name} is a field inside the form ${this.name} but an object is being set as its value. Ignored.`);
                continue;
            }
            fieldView.setValue(value);
        }
    }
    setData(data) {
        for (let [name, value] of Object.entries(data)) {
            if (value === undefined) {
                value = '';
            }
            this.data[name] = value;
            this.setValueToChild(name, value);
        }
    }
    getData(names) {
        if (!names) {
            return this.data;
        }
        const vo = {};
        for (const name of names) {
            const value = this.data[name];
            if (name !== undefined) {
                vo[name] = value;
            }
        }
        return vo;
    }
    extractData(params, messages) {
        let names = [];
        let reqNames = [];
        if (params) {
            for (const [nam, req] of Object.entries(params)) {
                names.push(nam);
                if (req) {
                    reqNames.push(nam);
                }
            }
        }
        else if (this.form) {
            names = this.form.keyFields || [];
            reqNames = names;
        }
        const data = this.getData(names);
        let allOk = true;
        for (const nam of reqNames) {
            const val = data[nam];
            if (val === undefined || val === '') {
                addMessage(`field ${nam} has no value.`, messages);
                allOk = false;
            }
        }
        console.info(`extracted data:`, data, params);
        if (allOk) {
            return data;
        }
        return undefined;
    }
    extractKeys(messages) {
        const data = {};
        const keys = this.form && this.form.keyFields;
        if (!keys) {
            logger.info(`Panel "${this.name}" has no form, or the form has no keys. An empty object is returned as key-values, with no error`);
            return data;
        }
        for (const key of keys) {
            const value = this.data[key];
            if (value === undefined || value === '' || value === 0) {
                addMessage(`Value for field "${key}" is missing`, messages);
                return undefined;
            }
            data[key] = value;
        }
        return data;
    }
    setValueToChild(name, value) {
        const controller = this.controllers[name];
        if (controller) {
            if (typeof value === 'object') {
                controller.setData(value);
            }
            else {
                console.error(`${name} is a child-controller in the from "${this.name} but a primitive value of ${value} is being set. Value ignored"`);
            }
            return;
        }
        const fieldView = this.fieldViews[name];
        if (!fieldView) {
            return;
        }
        if (typeof value === 'object') {
            console.error(`${name} is a field but a non-primitive value is being set.`);
            return;
        }
        fieldView.setValue(value);
    }
    setFieldValue(fieldName, value) {
        if (value === undefined) {
            value = '';
        }
        this.data[fieldName] = value;
        const fieldView = this.fieldViews[fieldName];
        if (fieldView) {
            fieldView.setValue(value);
        }
    }
    getFieldValue(fieldName) {
        return this.data[fieldName];
    }
    getChild(name) {
        return this.children[name];
    }
    isValid() {
        if (this.isDirty) {
            this.validate();
        }
        return this.allOk;
    }
    validate() {
        this.allOk = true;
        this.isDirty = false;
        for (const fieldValue of Object.values(this.fieldViews)) {
            if (!fieldValue.validate()) {
                this.allOk = false;
            }
        }
        /**
         * individual fields have been validated.
         * any further validation is relevant only if allOk at this point
         */
        if (!this.allOk) {
            return false;
        }
        /**
         * do we have any more validations?
         */
        if (!this.form) {
            return this.allOk;
        }
        // inter field validations are triggered only if all the fields are valid
        if (this.form.interFieldValidations) {
            for (const f of this.form.interFieldValidations) {
                if (this.isInterFieldValid(f) === false) {
                    const fieldName = f.field1;
                    const message = this.ac.getMessage(f.messageId);
                    this.reportFieldErrors([{ fieldName, message }]);
                }
            }
        }
        //form level validations are triggered only if there are no other errors
        if (this.allOk && this.form.validationFn) {
            const fd = this.ac.getFn(this.form.validationFn, 'form');
            if (!fd) {
                throw new Error(`${this.form.validationFn} is declared as the validationFn for form ${this.form.name} but it is not defined for the runtime`);
            }
            const fn = fd.fn;
            const msgs = fn(this);
            if (msgs) {
                this.reportFieldErrors(msgs);
            }
        }
        return this.allOk;
    }
    setModifiedStatus(isModified) {
        this.isDirty = isModified;
    }
    hasKeyValues() {
        if (!this.form) {
            return false;
        }
        const keys = this.form.keyFields;
        if (!keys) {
            return true;
        }
        for (const key of keys) {
            if (this.data[key] === undefined) {
                return false;
            }
        }
        return true;
    }
    valueHasChanged(fieldName, newValue, newValidity) {
        this.data[fieldName] = newValue;
        //if this validity has changed to false, then we have to set allOk to false
        if (newValidity !== undefined && newValidity === false) {
            this.allOk = false;
        }
    }
    valueIsChanging(_fieldName, _newValue, _newValidity) {
        // feature not yet designed
    }
    setDisplayState(fieldName, stateName, stateValue) {
        const f = this.children[fieldName];
        if (f) {
            f.setDisplayState(stateName, stateValue);
        }
    }
    eventOccurred(evt) {
        const viewListeners = this.listeners[evt.viewName];
        if (!viewListeners) {
            return;
        }
        const eventListeners = viewListeners[evt.eventName];
        if (!eventListeners) {
            return;
        }
        for (const handler of eventListeners) {
            if (typeof handler === 'string') {
                this.act(handler, evt.params);
            }
            else {
                handler(evt);
            }
        }
    }
    act(actionName, params) {
        this.pc.act(actionName, this, params);
    }
    reportFieldErrors(msgs) {
        this.allOk = false;
        for (const msg of msgs) {
            const fieldView = this.fieldViews[msg.fieldName];
            if (fieldView) {
                fieldView.setError(msg.message);
            }
            else {
                logger.error(`${msg.fieldName} is not a valid field, but it is reported with a validation error: "${msg.message}"`);
            }
        }
    }
    isInterFieldValid(v) {
        const v1 = this.data[v.field1];
        const v2 = this.data[v.field2];
        if (v.onlyIfFieldValueEquals !== undefined &&
            v1 !== undefined &&
            v.onlyIfFieldValueEquals !== v1.toString()) {
            //this rule is not applicable because f1 does not have the required value
            return true;
        }
        const v1Exists = v1 !== undefined && v1 !== '' && v1 !== 0;
        const v2Exists = v2 !== undefined && v2 !== '' && v2 !== 0;
        switch (v.validationType) {
            case 'bothOrNone':
                if (v1Exists) {
                    return v2Exists;
                }
                return !v2Exists;
            case 'bothOrSecond':
                if (v1Exists) {
                    return v2Exists;
                }
                return true;
            case 'oneOf':
                if (v1Exists) {
                    return !v2Exists;
                }
                return v2Exists;
            case 'equal':
                return v1Exists && v1 === v2;
            case 'different':
                return v1Exists && v1 != v2;
            case 'range':
                return v1Exists && v2Exists && v1 < v2;
            case 'rangeOrEqual':
                return v1Exists && v2Exists && v1 <= v2;
            default:
                throw new Error(`validation type ${v.validationType} is not handled by the data controller`);
        }
    }
    checkName(name) {
        if (this.controllers[name]) {
            const msg = `"${name}" is a duplicate child controller for form controller "${this.name}" `;
            logger.error(msg);
            throw new Error(msg);
        }
    }
}
exports.FC = FC;
function addMessage(text, msgs) {
    msgs.push({ text, id: '', type: 'error' });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybUNvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2NvbnRyb2xsZXIvZm9ybUNvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsa0RBQW1EO0FBMEJuRCxtRUFBOEM7QUFDOUMsbUVBQThDO0FBRTlDLE1BQU0sTUFBTSxHQUFHLG1CQUFVLENBQUMsU0FBUyxFQUFFLENBQUM7QUFFdEM7O0dBRUc7QUFDSCxNQUFhLEVBQUU7SUFvRGI7Ozs7O09BS0c7SUFDSCxZQUNrQixJQUFZLEVBQ1osRUFBa0IsRUFDakIsSUFBVyxFQUM1QixJQUFTO1FBSE8sU0FBSSxHQUFKLElBQUksQ0FBUTtRQUNaLE9BQUUsR0FBRixFQUFFLENBQWdCO1FBQ2pCLFNBQUksR0FBSixJQUFJLENBQU87UUEzRGQsU0FBSSxHQUFHLE1BQU0sQ0FBQztRQUV0QixnQkFBVyxHQUE4QixFQUFFLENBQUM7UUFDcEQ7O1dBRUc7UUFDYyxlQUFVLEdBQXlCLEVBQUUsQ0FBQztRQUN2RDs7V0FFRztRQUNLLFNBQUksR0FBTyxFQUFFLENBQUM7UUFDdEI7O1dBRUc7UUFDYyxhQUFRLEdBQXdCLEVBQUUsQ0FBQztRQUVwRCx1REFBdUQ7UUFDdEMsY0FBUyxHQUN4QixFQUFFLENBQUM7UUFFTDs7V0FFRztRQUNLLFlBQU8sR0FBRyxJQUFJLENBQUM7UUFDdkI7O1dBRUc7UUFDSyxVQUFLLEdBQUcsS0FBSyxDQUFDO1FBbUNwQixJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUM7UUFDaEIsSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUNULElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ25CLENBQUM7SUFDSCxDQUFDO0lBRUQsV0FBVztRQUNULE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMs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