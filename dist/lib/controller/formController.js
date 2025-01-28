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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybUNvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2NvbnRyb2xsZXIvZm9ybUNvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsa0RBQW1EO0FBMEJuRCxtRUFBOEM7QUFDOUMsbUVBQThDO0FBRTlDLE1BQU0sTUFBTSxHQUFHLG1CQUFVLENBQUMsU0FBUyxFQUFFLENBQUM7QUFFdEM7O0dBRUc7QUFDSCxNQUFhLEVBQUU7SUFvRGI7Ozs7O09BS0c7SUFDSCxZQUNrQixJQUFZLEVBQ1osRUFBa0IsRUFDakIsSUFBVyxFQUM1QixJQUFTO1FBSE8sU0FBSSxHQUFKLElBQUksQ0FBUTtRQUNaLE9BQUUsR0FBRixFQUFFLENBQWdCO1FBQ2pCLFNBQUksR0FBSixJQUFJLENBQU87UUEzRGQsU0FBSSxHQUFHLE1BQU0sQ0FBQztRQUV0QixnQkFBVyxHQUE4QixFQUFFLENBQUM7UUFDcEQ7O1dBRUc7UUFDYyxlQUFVLEdBQXlCLEVBQUUsQ0FBQztRQUN2RDs7V0FFRztRQUNLLFNBQUksR0FBTyxFQUFFLENBQUM7UUFDdEI7O1dBRUc7UUFDYyxhQUFRLEdBQXdCLEVBQUUsQ0FBQztRQUVwRCx1REFBdUQ7UUFDdEMsY0FBUyxHQUN4QixFQUFFLENBQUM7UUFFTDs7V0FFRztRQUNLLFlBQU8sR0FBRyxJQUFJLENBQUM7UUFDdkI7O1dBRUc7UUFDSyxVQUFLLEdBQUcsS0FBSyxDQUFDO1FBbUNwQixJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUM7UUFDaEIsSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUNULElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ25CLENBQUM7SUFDSCxDQUFDO0lBRUQsV0FBVztRQUNULE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztJQUNoRCxDQUFDO0lBRUQsYUFBYSxDQUFDLElBQWM7UUFDMUIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztRQUN2QixJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUN4QixPQUFPLENBQUMsS0FBSyxDQUNYLEdBQUcsSUFBSSw0Q0FBNEMsSUFBSSxDQUFDLElBQUksd0NBQXdDLENBQ3JHLENBQUM7WUFDRixPQUFPO1FBQ1QsQ0FBQztRQUVELElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDO1FBQzNCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1FBQy9CLElBQUksR0FBRyxLQUFLLE9BQU8sRUFBRSxDQUFDO1lBQ3BCLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBaUIsQ0FBQztRQUM1QyxDQUFDO2FBQU0sSUFBSSxHQUFHLEtBQUssT0FBTyxFQUFFLENBQUM7WUFDM0IsSUFBSyxJQUFJLENBQUMsSUFBWSxDQUFDLFFBQVEsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDOUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN0QixDQUFDO1FBQ0gsQ0FBQzthQUFNLElBQUksR0FBRyxLQUFLLE1BQU0sRUFBRSxDQUFDO1lBQzFCLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0IsQ0FBQztJQUNILENBQUM7SUFFRDs7O09BR0c7SUFDSyxhQUFhLENBQUMsU0FBaUI7UUFDckMsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUMzQixNQUFNLElBQUksS0FBSyxDQUNiLGNBQWMsU0FBUyxnRUFBZ0UsQ0FDeEYsQ0FBQztRQUNKLENBQUM7UUFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ3BCLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO1FBQ3RCLENBQUM7UUFFRCw4REFBOEQ7UUFDOUQsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEVBQUUsQ0FBQztRQUM1QixJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztJQUNyRCxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSyxRQUFRLENBQUMsU0FBaUI7UUFDaEMsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQzVCLE1BQU0sSUFBSSxLQUFLLENBQ2IsR0FBRyxTQUFTLHlEQUF5RCxDQUN0RSxDQUFDO1FBQ0osQ0FBQztRQUVELElBQUksSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQ3pCLE1BQU0sSUFBSSxLQUFLLENBQ2IsR0FBRyxTQUFTLDhHQUE4RyxDQUMzSCxDQUFDO1FBQ0osQ0FBQztRQUNEOztXQUVHO1FBQ0gsSUFBSSxDQUFDLGVBQWUsR0FBRyxFQUFFLENBQUM7UUFDMUIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7SUFDcEQsQ0FBQztJQUVNLFFBQVE7UUFDYixJQUFJLENBQUMsZUFBZSxHQUFHLFNBQVMsQ0FBQztJQUNuQyxDQUFDO0lBRU0sYUFBYTtRQUNsQixJQUFJLENBQUMsZUFBZSxHQUFHLFNBQVMsQ0FBQztRQUNqQyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsU0FBUyxDQUFDO0lBQ3JDLENBQUM7SUFFRCxZQUFZO1FBQ1YsS0FBSyxNQUFNLFNBQVMsSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO1lBQ3ZELE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUM7WUFDOUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDcEIsU0FBUztZQUNYLENBQUM7WUFFRCxJQUFJLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDdEIsTUFBTSxDQUFDLElBQUksQ0FDVCxnQkFBZ0IsS0FBSyxDQUFDLElBQUksK0dBQStHLENBQzFJLENBQUM7Z0JBQ0YsU0FBUztZQUNYLENBQUM7WUFFRDs7ZUFFRztZQUNILElBQUksS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUN2QixJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUMvQyxTQUFTO1lBQ1gsQ0FBQztZQUNEOztlQUVHO1lBQ0gsSUFBSSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUM1QixJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDM0IsU0FBUztZQUNYLENBQUM7WUFFRDs7ZUFFRztZQUNILE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDM0QsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUNoQixNQUFNLENBQUMsS0FBSyxDQUNWLFNBQVMsS0FBSyxDQUFDLElBQUksU0FBUyxLQUFLLENBQUMsZ0JBQWdCLHdGQUF3RixDQUMzSSxDQUFDO2dCQUNGLFNBQVM7WUFDWCxDQUFDO1lBRUQ7O2VBRUc7WUFDSCxNQUFNLFFBQVEsR0FBRyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDdkMsSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDYixJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsRUFBRSxHQUFHLFFBQVEsQ0FBQyxDQUFDO2dCQUMxQyxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ2pELENBQUM7WUFDRDs7ZUFFRztZQUNILElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFO2dCQUN2RCxNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDO2dCQUM5QixPQUFPLENBQUMsR0FBRyxDQUNULG1DQUFtQyxLQUFLLENBQUMsSUFBSSxvQkFBb0IsS0FBSyxDQUFDLGdCQUFnQiw0QkFBNEIsUUFBUSxJQUFJLENBQ2hJLENBQUM7Z0JBQ0Y7O21CQUVHO2dCQUNILElBQ0UsUUFBUSxLQUFLLFNBQVM7b0JBQ3RCLFFBQVEsS0FBSyxFQUFFO29CQUNmLEdBQUcsQ0FBQyxXQUFXLEtBQUssS0FBSyxFQUN6QixDQUFDO29CQUNELE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxTQUFTLENBQUMsSUFBSSxjQUFjLENBQUMsQ0FBQztvQkFDeEQsU0FBUyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDdEIsT0FBTztnQkFDVCxDQUFDO2dCQUVELElBQUksS0FBc0IsQ0FBQztnQkFDM0IsSUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRLEVBQUUsQ0FBQztvQkFDakMsS0FBSyxHQUFHLFFBQWtCLENBQUM7Z0JBQzdCLENBQUM7cUJBQU0sQ0FBQztvQkFDTixLQUFLLEdBQUcsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUM5QixDQUFDO2dCQUVELE9BQU8sQ0FBQyxHQUFHLENBQUMsMkJBQTJCLENBQUMsQ0FBQztnQkFDekMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3BDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVEOztXQUVHO1FBQ0gsSUFBSSxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDN0IsQ0FBQztJQUVELFdBQVc7UUFDVCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7SUFDdkIsQ0FBQztJQUVELHdCQUF3QixDQUFDLElBQXFCO1FBQzVDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDdkIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNyQixNQUFNLFVBQVUsR0FBRyxJQUFJLDJCQUFHLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsVUFBVSxDQUFDO1FBQ3BDLE9BQU8sVUFBVSxDQUFDO0lBQ3BCLENBQUM7SUFFRCx3QkFBd0IsQ0FBQyxJQUFxQjtRQUM1QyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckIsTUFBTSxVQUFVLEdBQUcsSUFBSSwyQkFBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN2QyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxHQUFHLFVBQVUsQ0FBQztRQUNwQyxPQUFPLFVBQVUsQ0FBQztJQUNwQixDQUFDO0lBRUQsaUJBQWlCLENBQUMsSUFBWSxFQUFFLElBQVcsRUFBRSxJQUFTO1FBQ3BELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckIsTUFBTSxVQUFVLEdBQUcsSUFBSSxFQUFFLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3JELElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsVUFBVSxDQUFDO1FBQ3BDLE9BQU8sVUFBVSxDQUFDO0lBQ3BCLENBQUM7SUFFRCxhQUFhLENBQUMsSUFBWTtRQUN4QixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUVELHFCQUFxQixDQUFDLElBQVk7UUFDaEMsS0FBSyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUM7WUFDOUQsSUFBSSxTQUFTLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQ3ZCLE9BQU8sQ0FBQyxDQUFDO1lBQ1gsQ0FBQztZQUNELElBQUksQ0FBQyxDQUFDLElBQUksS0FBSyxNQUFNLEVBQUUsQ0FBQztnQkFDdEIsTUFBTSxDQUFDLEdBQUksQ0FBb0IsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDNUQsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDTixPQUFPLENBQUMsQ0FBQztnQkFDWCxDQUFDO1lBQ0gsQ0FBQztRQUNILENBQUM7UUFDRCxPQUFPLFNBQVMsQ0FBQztJQUNuQixDQUFDO0lBRU0sZ0JBQWdCLENBQ3JCLFFBQWdCLEVBQ2hCLFNBQW9CLEVBQ3BCLE9BQXFCO1FBRXJCLElBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDN0MsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ25CLGFBQWEsR0FBRyxFQUFFLENBQUM7WUFDbkIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsR0FBRyxhQUFhLENBQUM7UUFDM0MsQ0FBQztRQUVELElBQUksY0FBYyxHQUFHLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUM5QyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDcEIsY0FBYyxHQUFHLEVBQUUsQ0FBQztZQUNwQixhQUFhLENBQUMsU0FBUyxDQUFDLEdBQUcsY0FBYyxDQUFDO1FBQzVDLENBQUM7UUFDRCxjQUFjLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQy9CLENBQUM7SUFFRCxXQUFXLENBQUMsRUFBYSxFQUFFLFNBQWtCO1FBQzNDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO1lBQ3RCLE1BQU0sQ0FBQyxLQUFLLENBQ1YsY0FBYyxJQUFJLENBQUMsSUFBSSxpRkFBaUYsQ0FDekcsQ0FBQztZQUNGLE9BQU87UUFDVCxDQUFDO1FBQ0QsTUFBTSxJQUFJLEdBQUcsRUFBUSxDQUFDO1FBQ3RCLElBQUksU0FBUyxFQUFFLENBQUM7WUFDZCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRS9DLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDaEIsTUFBTSxDQUFDLEtBQUssQ0FDVixjQUFjLElBQUksQ0FBQyxJQUFJLE1BQU0sU0FBUyxnRkFBZ0YsQ0FDdkgsQ0FBQztnQkFDRixPQUFPO1lBQ1QsQ0FBQztZQUVEOztlQUVHO1lBQ0gsSUFBSSxVQUFVLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFBRSxDQUFDO2dCQUMvQixVQUFVLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUN2QixPQUFPO1lBQ1QsQ0FBQztZQUVEOztlQUVHO1lBQ0gsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDMUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNWLE1BQU0sQ0FBQyxLQUFLLENBQ1YsbUNBQW1DLFNBQVMsd0NBQXdDLFNBQVMsNEJBQTRCLENBQzFILENBQUM7Z0JBQ0YsT0FBTztZQUNULENBQUM7WUFFRCxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDeEIsVUFBVSxDQUFDLFdBQVcsQ0FBQyxJQUFZLENBQUMsQ0FBQztnQkFDckMsT0FBTztZQUNULENBQUM7WUFFRCxNQUFNLENBQUMsS0FBSyxDQUNWLG1CQUFtQixTQUFTLHNEQUFzRCxPQUFPLElBQUksaUJBQWlCLENBQy9HLENBQUM7WUFDRixPQUFPO1FBQ1QsQ0FBQztRQUVEOztXQUVHO1FBQ0gsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDeEIsTUFBTSxDQUFDLEtBQUssQ0FDVixtREFBbUQsSUFBSSxDQUFDLElBQUkscUJBQXFCLENBQ2xGLENBQUM7WUFDRixPQUFPO1FBQ1QsQ0FBQztRQUVELElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLEtBQUssTUFBTSxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO1lBQ2hFLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN2QixJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDeEIsS0FBSyxHQUFHLEVBQUUsQ0FBQztZQUNiLENBQUM7aUJBQU0sSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDckMsT0FBTyxDQUFDLEtBQUssQ0FDWCxHQUFHLElBQUksK0JBQStCLElBQUksQ0FBQyxJQUFJLG9EQUFvRCxDQUNwRyxDQUFDO2dCQUNGLFNBQVM7WUFDWCxDQUFDO1lBQ0QsU0FBUyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM1QixDQUFDO0lBQ0gsQ0FBQztJQUVELE9BQU8sQ0FBQyxJQUFRO1FBQ2QsS0FBSyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUMvQyxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDeEIsS0FBSyxHQUFHLEVBQUUsQ0FBQztZQUNiLENBQUM7WUFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQztZQUN4QixJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNwQyxDQUFDO0lBQ0gsQ0FBQztJQUVELE9BQU8sQ0FBQyxLQUFnQjtRQUN0QixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDWCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDbkIsQ0FBQztRQUNELE1BQU0sRUFBRSxHQUFPLEVBQUUsQ0FBQztRQUNsQixLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssRUFBRSxDQUFDO1lBQ3pCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUIsSUFBSSxJQUFJLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ3ZCLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUM7WUFDbkIsQ0FBQztRQUNILENBQUM7UUFDRCxPQUFPLEVBQUUsQ0FBQztJQUNaLENBQUM7SUFFRCxXQUFXLENBQ1QsTUFBMEIsRUFDMUIsUUFBMkI7UUFFM0IsSUFBSSxLQUFLLEdBQWEsRUFBRSxDQUFDO1FBQ3pCLElBQUksUUFBUSxHQUFhLEVBQUUsQ0FBQztRQUM1QixJQUFJLE1BQU0sRUFBRSxDQUFDO1lBQ1gsS0FBSyxNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztnQkFDaEQsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDaEIsSUFBSSxHQUFHLEVBQUUsQ0FBQztvQkFDUixRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNyQixDQUFDO1lBQ0gsQ0FBQztRQUNILENBQUM7YUFBTSxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNyQixLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLElBQUksRUFBRSxDQUFDO1lBQ2xDLFFBQVEsR0FBRyxLQUFLLENBQUM7UUFDbkIsQ0FBQztRQUVELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDakMsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLEtBQUssTUFBTSxHQUFHLElBQUksUUFBUSxFQUFFLENBQUM7WUFDM0IsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3RCLElBQUksR0FBRyxLQUFLLFNBQVMsSUFBSSxHQUFHLEtBQUssRUFBRSxFQUFFLENBQUM7Z0JBQ3BDLFVBQVUsQ0FBQyxTQUFTLEdBQUcsZ0JBQWdCLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQ25ELEtBQUssR0FBRyxLQUFLLENBQUM7WUFDaEIsQ0FBQztRQUNILENBQUM7UUFFRCxPQUFPLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztRQUM5QyxJQUFJLEtBQUssRUFBRSxDQUFDO1lBQ1YsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDO1FBQ0QsT0FBTyxTQUFTLENBQUM7SUFDbkIsQ0FBQztJQUVELFdBQVcsQ0FBQyxRQUEyQjtRQUNyQyxNQUFNLElBQUksR0FBVyxFQUFFLENBQUM7UUFDeEIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztRQUM5QyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDVixNQUFNLENBQUMsSUFBSSxDQUNULFVBQVUsSUFBSSxDQUFDLElBQUksa0dBQWtHLENBQ3RILENBQUM7WUFDRixPQUFPLElBQUksQ0FBQztRQUNkLENBQUM7UUFFRCxLQUFLLE1BQU0sR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO1lBQ3ZCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDN0IsSUFBSSxLQUFLLEtBQUssU0FBUyxJQUFJLEtBQUssS0FBSyxFQUFFLElBQUksS0FBSyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN2RCxVQUFVLENBQUMsb0JBQW9CLEdBQUcsY0FBYyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUM1RCxPQUFPLFNBQVMsQ0FBQztZQUNuQixDQUFDO1lBQ0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQWMsQ0FBQztRQUM3QixDQUFDO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBQ08sZUFBZSxDQUFDLElBQVksRUFBRSxLQUEyQjtRQUMvRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzFDLElBQUksVUFBVSxFQUFFLENBQUM7WUFDZixJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUM5QixVQUFVLENBQUMsT0FBTyxDQUFDLEtBQWtCLENBQUMsQ0FBQztZQUN6QyxDQUFDO2lCQUFNLENBQUM7Z0JBQ04sT0FBTyxDQUFDLEtBQUssQ0FDWCxHQUFHLElBQUksdUNBQXVDLElBQUksQ0FBQyxJQUFJLDZCQUE2QixLQUFLLCtCQUErQixDQUN6SCxDQUFDO1lBQ0osQ0FBQztZQUNELE9BQU87UUFDVCxDQUFDO1FBRUQsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV4QyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDZixPQUFPO1FBQ1QsQ0FBQztRQUVELElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDOUIsT0FBTyxDQUFDLEtBQUssQ0FDWCxHQUFHLElBQUkscURBQXFELENBQzdELENBQUM7WUFDRixPQUFPO1FBQ1QsQ0FBQztRQUVELFNBQVMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQUVELGFBQWEsQ0FBQyxTQUFpQixFQUFFLEtBQVk7UUFDM0MsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDeEIsS0FBSyxHQUFHLEVBQUUsQ0FBQztRQUNiLENBQUM7UUFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEtBQUssQ0FBQztRQUM3QixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzdDLElBQUksU0FBUyxFQUFFLENBQUM7WUFDYixTQUF1QixDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMzQyxDQUFDO0lBQ0gsQ0FBQztJQUVELGFBQWEsQ0FBQyxTQUFpQjtRQUM3QixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFVLENBQUM7SUFDdkMsQ0FBQztJQUVELFFBQVEsQ0FBQyxJQUFZO1FBQ25CLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM3QixDQUFDO0lBRUQsT0FBTztRQUNMLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2pCLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNsQixDQUFDO1FBQ0QsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ3BCLENBQUM7SUFFRCxRQUFRO1FBQ04sSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7UUFDbEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7UUFDckIsS0FBSyxNQUFNLFVBQVUsSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO1lBQ3hELElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7WUFDckIsQ0FBQztRQUNILENBQUM7UUFFRDs7O1dBR0c7UUFDSCxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2hCLE9BQU8sS0FBSyxDQUFDO1FBQ2YsQ0FBQztRQUVEOztXQUVHO1FBQ0gsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNmLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztRQUNwQixDQUFDO1FBRUQseUVBQXlFO1FBQ3pFLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1lBQ3BDLEtBQUssTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO2dCQUNoRCxJQUFJLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsS0FBSyxLQUFLLEVBQUUsQ0FBQztvQkFDeEMsTUFBTSxTQUFTLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztvQkFDM0IsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUNoRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ25ELENBQUM7WUFDSCxDQUFDO1FBQ0gsQ0FBQztRQUVELHdFQUF3RTtRQUN4RSxJQUFJLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUN6QyxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQztZQUN6RCxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ1IsTUFBTSxJQUFJLEtBQUssQ0FDYixHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSw2Q0FBNkMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLHdDQUF3QyxDQUM3SCxDQUFDO1lBQ0osQ0FBQztZQUNELE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUE0QixDQUFDO1lBQzNDLE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUV0QixJQUFJLElBQUksRUFBRSxDQUFDO2dCQUNULElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMvQixDQUFDO1FBQ0gsQ0FBQztRQUNELE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztJQUNwQixDQUFDO0lBRUQsaUJBQWlCLENBQUMsVUFBbUI7UUFDbkMsSUFBSSxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUM7SUFDNUIsQ0FBQztJQUVELFlBQVk7UUFDVixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ2YsT0FBTyxLQUFLLENBQUM7UUFDZixDQUFDO1FBQ0QsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7UUFDakMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ1YsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDO1FBQ0QsS0FBSyxNQUFNLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUN2QixJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ2pDLE9BQU8sS0FBSyxDQUFDO1lBQ2YsQ0FBQztRQUNILENBQUM7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCxlQUFlLENBQ2IsU0FBaUIsRUFDakIsUUFBZSxFQUNmLFdBQXFCO1FBRXJCLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsUUFBUSxDQUFDO1FBRWhDLDJFQUEyRTtRQUMzRSxJQUFJLFdBQVcsS0FBSyxTQUFTLElBQUksV0FBVyxLQUFLLEtBQUssRUFBRSxDQUFDO1lBQ3ZELElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ3JCLENBQUM7SUFDSCxDQUFDO0lBRUQsZUFBZSxDQUNiLFVBQWtCLEVBQ2xCLFNBQWdCLEVBQ2hCLFlBQXNCO1FBRXRCLDJCQUEyQjtJQUM3QixDQUFDO0lBRUQsZUFBZSxDQUNiLFNBQWlCLEVBQ2pCLFNBQWlCLEVBQ2pCLFVBQXFDO1FBRXJDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDbkMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUNOLENBQUMsQ0FBQyxlQUFlLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQzNDLENBQUM7SUFDSCxDQUFDO0lBRUQsYUFBYSxDQUFDLEdBQWlCO1FBQzdCLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ25ELElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUNuQixPQUFPO1FBQ1QsQ0FBQztRQUVELE1BQU0sY0FBYyxHQUFHLGFBQWEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDcEQsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3BCLE9BQU87UUFDVCxDQUFDO1FBRUQsS0FBSyxNQUFNLE9BQU8sSUFBSSxjQUFjLEVBQUUsQ0FBQztZQUNyQyxJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUNoQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDaEMsQ0FBQztpQkFBTSxDQUFDO2dCQUNMLE9BQXdCLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDakMsQ0FBQztRQUNILENBQUM7SUFDSCxDQUFDO0lBRUQsR0FBRyxDQUFDLFVBQWtCLEVBQUUsTUFBZTtRQUNyQyxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFTyxpQkFBaUIsQ0FDdkIsSUFBOEM7UUFFOUMsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDbkIsS0FBSyxNQUFNLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUN2QixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNqRCxJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUNkLFNBQVMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2xDLENBQUM7aUJBQU0sQ0FBQztnQkFDTixNQUFNLENBQUMsS0FBSyxDQUNWLEdBQUcsR0FBRyxDQUFDLFNBQVMsdUVBQXVFLEdBQUcsQ0FBQyxPQUFPLEdBQUcsQ0FDdEcsQ0FBQztZQUNKLENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztJQUVPLGlCQUFpQixDQUFDLENBQXVCO1FBQy9DLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQy9CLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRS9CLElBQ0UsQ0FBQyxDQUFDLHNCQUFzQixLQUFLLFNBQVM7WUFDdEMsRUFBRSxLQUFLLFNBQVM7WUFDaEIsQ0FBQyxDQUFDLHNCQUFzQixLQUFLLEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFDMUMsQ0FBQztZQUNELHlFQUF5RTtZQUN6RSxPQUFPLElBQUksQ0FBQztRQUNkLENBQUM7UUFFRCxNQUFNLFFBQVEsR0FBRyxFQUFFLEtBQUssU0FBUyxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMzRCxNQUFNLFFBQVEsR0FBRyxFQUFFLEtBQUssU0FBUyxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUUzRCxRQUFRLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUN6QixLQUFLLFlBQVk7Z0JBQ2YsSUFBSSxRQUFRLEVBQUUsQ0FBQztvQkFDYixPQUFPLFFBQVEsQ0FBQztnQkFDbEIsQ0FBQztnQkFDRCxPQUFPLENBQUMsUUFBUSxDQUFDO1lBRW5CLEtBQUssY0FBYztnQkFDakIsSUFBSSxRQUFRLEVBQUUsQ0FBQztvQkFDYixPQUFPLFFBQVEsQ0FBQztnQkFDbEIsQ0FBQztnQkFDRCxPQUFPLElBQUksQ0FBQztZQUVkLEtBQUssT0FBTztnQkFDVixJQUFJLFFBQVEsRUFBRSxDQUFDO29CQUNiLE9BQU8sQ0FBQyxRQUFRLENBQUM7Z0JBQ25CLENBQUM7Z0JBQ0QsT0FBTyxRQUFRLENBQUM7WUFFbEIsS0FBSyxPQUFPO2dCQUNWLE9BQU8sUUFBUSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUM7WUFFL0IsS0FBSyxXQUFXO2dCQUNkLE9BQU8sUUFBUSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUM7WUFFOUIsS0FBSyxPQUFPO2dCQUNWLE9BQU8sUUFBUSxJQUFJLFFBQVEsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDO1lBRXpDLEtBQUssY0FBYztnQkFDakIsT0FBTyxRQUFRLElBQUksUUFBUSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUM7WUFFMUM7Z0JBQ0UsTUFBTSxJQUFJLEtBQUssQ0FDYixtQkFBbUIsQ0FBQyxDQUFDLGNBQWMsd0NBQXdDLENBQzVFLENBQUM7UUFDTixDQUFDO0lBQ0gsQ0FBQztJQUVPLFNBQVMsQ0FBQyxJQUFZO1FBQzVCLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQzNCLE1BQU0sR0FBRyxHQUFHLElBQUksSUFBSSwwREFBMEQsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDO1lBQzVGLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDbEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN2QixDQUFDO0lBQ0gsQ0FBQztDQUNGO0FBM3NCRCxnQkEyc0JDO0FBRUQsU0FBUyxVQUFVLENBQUMsSUFBWSxFQUFFLElBQXVCO0lBQ3ZELElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztBQUM3QyxDQUFDIn0=