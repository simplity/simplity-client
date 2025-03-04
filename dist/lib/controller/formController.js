import { loggerStub } from '../logger-stub/logger';
import { TWC } from './tableViewerController';
import { TEC } from './TableEditorController';
import { CC } from './chartController';
const logger = loggerStub.getLogger();
/**
 * controls a row in a table or the root fields in a page.
 */
export class FC {
    name;
    pc;
    form;
    ac;
    type = 'form';
    controllers = {};
    /**
     * all fields in this form.
     */
    fieldViews = {};
    /**
     * this is THE MODEL that this controller should control
     */
    data = {};
    /**
     * all the registered children
     */
    children = {};
    // {fieldName: {eventName: [handler1, handler2, ...] }}
    listeners = {};
    /**
     * set to true whenever a child reports a data-change
     */
    isDirty = true;
    /**
     * last known validation status. To be used only if isDirty is false;
     */
    allOk = false;
    /**
     * editable fields within tab-children of tabs panel.
     * For each tabs panel, for each tab-child of that tabs, we have an array of editable fields.
     * populated if the tabs panel is marked as trackErrors
     */
    tabGroups;
    /**
     * array that would contain one entry for each child-tab. (Each entry would be again an array)
     * This is used during registration process.
     */
    currentGroupArray;
    /**
     * current tab that is open to which any editable field is to be added to.
     * This is used during registration process.
     *
     * registerFields() would push editable fields into this array
     */
    currentTabArray;
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
        const controller = new TWC(this, view);
        this.controllers[name] = controller;
        return controller;
    }
    newTableEditorController(view) {
        const name = view.name;
        this.checkName(name);
        const controller = new TEC(this, view);
        this.controllers[name] = controller;
        return controller;
    }
    newFormController(name, form, data) {
        this.checkName(name);
        const controller = new FC(name, this.pc, form, data);
        this.controllers[name] = controller;
        return controller;
    }
    newChartController(view) {
        this.checkName(view.name);
        const controller = new CC(this, view);
        this.controllers[view.name] = controller;
        return controller;
    }
    getController(name) {
        for (const [panelName, c] of Object.entries(this.controllers)) {
            if (panelName === name) {
                return c;
            }
            if (c.type === 'form') {
                const f = c.getController(name);
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
            const controller = this.getController(childName);
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
        /**
         * this is more a 'reset to values' than just set-value.
         * Hence we go by fields and set the value either to the received value or to ''.
         */
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
        //TODO: we considered fields as "reset". Should we do the same with child-controllers?
        /**
         * we DO NOT treat this as reset. It is up to the server to send [] or {} as data
         */
        for (const [name, controller] of Object.entries(this.controllers)) {
            const d = data[name];
            if (d) {
                controller.receiveData(d);
            }
            else {
                logger.info(`No data received for panel/form/table '${name}'`);
            }
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
    resetData(fields) {
        if (!fields) {
            this.receiveData({});
            return;
        }
        for (const field of fields) {
            this.setFieldValue(field, '');
        }
    }
    setValueToChild(name, value) {
        const controller = this.getController(name);
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
function addMessage(text, msgs) {
    msgs.push({ text, id: '', type: 'error' });
}
//# sourceMappingURL=formController.js.map