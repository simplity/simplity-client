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
            logger.error(`${name} is a duplicate child-name for the form "${this.name}. This may create unexpected behavior"`);
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
             * key field may have a default value..
             */
            const keyValue = keyControl.getValue();
            if (keyValue) {
                this.pc.getList(fieldView, '' + keyValue);
                this.pc.getList(fieldView, field.listKeyValue);
            }
            /**
             * wire the "change" event to get a keyed list for this drop-down-field
             */
            this.addEventListener(keyControl.name, 'change', (evt) => {
                const newValue = evt.newValue;
                /**
                 * empty list when key has no value,
                 */
                if (newValue === undefined ||
                    newValue === '' ||
                    evt.newValidity === false) {
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
                this.pc.getList(fieldView, value);
            });
        }
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
                logger.error(`${name} is a field inside the form ${this.name} but an object is being set as its value. Ignored.`);
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
                logger.error(`${name} is a child-controller in the from "${this.name} but a primitive value of ${value} is being set. Value ignored"`);
            }
            return;
        }
        const fieldView = this.fieldViews[name];
        if (!fieldView) {
            return;
        }
        if (typeof value === 'object') {
            logger.error(`${name} is a field but a non-primitive value is being set.`);
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
    setDisplayState(compName, settings) {
        const f = this.children[compName];
        if (f) {
            f.setDisplayState(settings);
            return true;
        }
        for (const c of Object.values(this.controllers)) {
            if (c.setDisplayState(compName, settings)) {
                return true;
            }
        }
        return false;
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