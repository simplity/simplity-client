import { loggerStub } from '../logger-stub/logger';
import { FC } from './formController';
const logger = loggerStub.getLogger();
/**
 * controls a tabular data (rows and columns)
 */
export class TEC {
    fc;
    type = 'grid';
    name;
    ac;
    pc;
    /**
     * form on which this table is based. It is usually provided, but not mandatory.
     */
    form;
    /**
     * met-data of the table panel
     */
    table;
    /**
     * viw-component instance associated with this table (e.g. angular component)
     */
    view;
    /**
     * data behind this view-component
     * this is THE MODEL that this controller is controlling
     * since the view is for readonly, the data is not modified
     * however, if selection is enables, this additional column is added to the data
     *
     */
    data = [];
    /**
     * data controllers, one per row, but only if this is an editable table
     */
    controllers = [];
    /**
     * important to note that this constructor is called from the constructor of tableView.
     * TableView MAY NOPT be rendered fully. Hence instance of tableView should not be used to invoke any of its methods inside this constructor
     * @param fc form controller that manages this table
     * @param view
     */
    constructor(fc, view) {
        this.fc = fc;
        this.name = view.name;
        this.pc = fc.pc;
        this.ac = this.pc.ac;
        this.view = view;
        this.table = view.table;
        const formName = this.table.formName;
        if (formName) {
            this.form = this.ac.getForm(formName);
        }
    }
    //todo: implement this
    isModified() {
        return false;
    }
    tableRendered() {
        //Good to know. We do not see any work as of now.
    }
    getFormName() {
        return this.form && this.form.name;
    }
    receiveData(data) {
        if (Array.isArray(data)) {
            this.setData(data);
            return;
        }
        logger.error(`${this.name} is a table controller but a non-array data is being set. Data ignored`);
    }
    setData(data) {
        if (data === undefined) {
            data = [];
        }
        else if (Array.isArray(data) === false) {
            logger.error(`non-array data received for table ${this.name}`);
            data = [];
        }
        this.data = data;
        this.view.reset();
        this.controllers = [];
        //add rows to the view
        let idx = 0;
        for (const row of data) {
            this.doAppend(idx, row);
            idx++;
        }
    }
    resetData(fields) {
        this.setData([]);
    }
    appendRow(values) {
        const idx = this.controllers.length;
        this.doAppend(idx, values);
        return idx;
    }
    doAppend(idx, row) {
        const name = this.name + '_' + idx;
        const fc = new FC(name, this.pc, this.form, row);
        this.controllers.push(fc);
        this.view.appendRow(fc, idx, row);
        fc.formRendered();
    }
    getData() {
        /**
         * not all fields from the form may be rendered.
         * we need to include received data even if it is not rendered.
         * hence each row is a merged object of received+edited; (edited would override received data)
         */
        const rows = [];
        for (const c of this.controllers) {
            rows.push(c.getData());
        }
        return rows;
    }
    getColumnValues(names, rowId) {
        const values = {};
        const row = this.data[rowId];
        if (!row) {
            this.warn(rowId);
            return values;
        }
        let fieldsMissing = false;
        for (const name of names) {
            const value = row[name];
            if (value === undefined) {
                fieldsMissing = false;
            }
            else {
                values[name] = value;
            }
        }
        if (fieldsMissing) {
            const rowData = this.controllers[rowId].getData();
            for (const name of names) {
                const value = rowData[name];
                if (value !== undefined) {
                    values[name] = value;
                }
            }
        }
        return values;
    }
    setColumnValues(values, rowId) {
        const row = this.data[rowId];
        if (!row) {
            this.warn(rowId);
            return;
        }
        const fc = this.controllers[rowId];
        for (const [name, value] of Object.entries(values)) {
            row[name] = value;
            if (fc) {
                fc.setFieldValue(name, value);
            }
        }
    }
    rowClicked(rowIdx) {
        const idx = this.sanitizeIdx(rowIdx);
        if (idx === undefined) {
            return;
        }
    }
    warn(rowId) {
        logger.warn(`Table ${this.name} has ${this.data.length} rows, but a request was made for row ${rowId} (0 based)`);
    }
    isValid() {
        return this.validate();
    }
    /**
     * validate all editable components again
     * @returns true is all editable components are valid. false otherwise
     */
    validate() {
        let allOk = false;
        for (const dc of this.controllers) {
            const ok = dc.validate();
            if (!ok) {
                allOk = false;
            }
        }
        return allOk;
    }
    sanitizeIdx(idx) {
        if (idx >= 0 && idx < this.data.length) {
            return idx;
        }
        return undefined;
    }
    setDisplayState(_compName, _settings) {
        return false;
    }
    setColumnDisplayState(_columnName, _stateName, _stateValue) {
        throw new Error('Method not implemented.');
    }
    setCellDisplayState(_columnName, _stateName, _stateValue, _rowId) {
        throw new Error('Method not implemented.');
    }
}
//# sourceMappingURL=TableEditorController.js.map