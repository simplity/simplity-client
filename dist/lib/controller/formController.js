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
            const field = fieldView.comp;
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
                let value;
                if (newValue !== undefined) {
                    if (typeof value === 'number') {
                        value = newValue;
                    }
                    else {
                        value = newValue.toString();
                    }
                }
                this.pc.getList(fieldView, value);
            });
        }
    }
    getChild(name) {
        return this.children[name];
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
            //list is the default name under which some generic services are designed to serve rows of data
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
            if (name === 'comparator') {
                console.info(`comparator set to ${value}`);
            }
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
        if (fieldName === 'comparator') {
            console.info(`setFieldValue for comparator = ${value}`);
        }
        const fieldView = this.fieldViews[fieldName];
        if (fieldView) {
            fieldView.setValue(value);
        }
    }
    getFieldValue(fieldName) {
        return this.data[fieldName];
    }
    getChildView(name) {
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
        console.info(`valueHasChanged() triggered for field "${fieldName}" with new value ="${newValue}" and new validity=${newValidity}`);
        if (newValidity !== undefined) {
            //it got changed
            if (!newValidity) {
                this.allOk = false;
            }
        }
    }
    valueIsChanging(_fieldName, _newValue, _newValidity) {
        // feature not yet designed
    }
    setDisplay(names, settings) {
        for (const name of names) {
            const f = this.children[name];
            if (f) {
                f.setDisplay(settings);
            }
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
                fieldView.setDisplay({ error: msg.message });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybUNvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2NvbnRyb2xsZXIvZm9ybUNvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsa0RBQW1EO0FBMkJuRCxtRUFBOEM7QUFDOUMsbUVBQThDO0FBRTlDLE1BQU0sTUFBTSxHQUFHLG1CQUFVLENBQUMsU0FBUyxFQUFFLENBQUM7QUFFdEM7O0dBRUc7QUFDSCxNQUFhLEVBQUU7SUFvRGI7Ozs7O09BS0c7SUFDSCxZQUNrQixJQUFZLEVBQ1osRUFBa0IsRUFDakIsSUFBVyxFQUM1QixJQUFTO1FBSE8sU0FBSSxHQUFKLElBQUksQ0FBUTtRQUNaLE9BQUUsR0FBRixFQUFFLENBQWdCO1FBQ2pCLFNBQUksR0FBSixJQUFJLENBQU87UUEzRGQsU0FBSSxHQUFHLE1BQU0sQ0FBQztRQUV0QixnQkFBVyxHQUE4QixFQUFFLENBQUM7UUFDcEQ7O1dBRUc7UUFDYyxlQUFVLEdBQXlCLEVBQUUsQ0FBQztRQUN2RDs7V0FFRztRQUNLLFNBQUksR0FBTyxFQUFFLENBQUM7UUFDdEI7O1dBRUc7UUFDYyxhQUFRLEdBQXdCLEVBQUUsQ0FBQztRQUVwRCx1REFBdUQ7UUFDdEMsY0FBUyxHQUN4QixFQUFFLENBQUM7UUFFTDs7V0FFRztRQUNLLFlBQU8sR0FBRyxJQUFJLENBQUM7UUFDdkI7O1dBRUc7UUFDSyxVQUFLLEdBQUcsS0FBSyxDQUFDO1FBbUNwQixJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUM7UUFDaEIsSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUNULElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ25CLENBQUM7SUFDSCxDQUFDO0lBRUQsV0FBVztRQUNULE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMs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