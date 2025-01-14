"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEC = void 0;
const logger_1 = require("../logger-stub/logger");
const formController_1 = require("./formController");
const logger = logger_1.loggerStub.getLogger();
/**
 * controls a tabular data (rows and columns)
 */
class TEC {
    /**
     * important to note that this constructor is called from the constructor of tableView.
     * TableView MAY NOPT be rendered fully. Hence instance of tableView should not be used to invoke any of its methods inside this constructor
     * @param fc form controller that manages this table
     * @param view
     */
    constructor(fc, view) {
        this.fc = fc;
        this.type = 'grid';
        /**
         * data behind this view-component
         * this is THE MODEL that this controller is controlling
         * since the view is for readonly, the data is not modified
         * however, if selection is enables, this additional column is added to the data
         *
         */
        this.data = [];
        /**
         * data controllers, one per row, but only if this is an editable table
         */
        this.controllers = [];
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
        console.error(`${this.name} is a table controller but a non-array data is being set. Data ignored`);
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
    appendRow(values) {
        const idx = this.controllers.length;
        this.doAppend(idx, values);
        return idx;
    }
    doAppend(idx, row) {
        const name = this.name + '_' + idx;
        const fc = new formController_1.FC(name, this.pc, this.form, row);
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
    setColumnDisplayState(_columnName, _stateName, _stateValue) {
        throw new Error('Method not implemented.');
    }
    setCellDisplayState(_columnName, _stateName, _stateValue, _rowId) {
        throw new Error('Method not implemented.');
    }
}
exports.TEC = TEC;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGFibGVFZGl0b3JDb250cm9sbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9jb250cm9sbGVyL1RhYmxlRWRpdG9yQ29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxrREFBbUQ7QUFZbkQscURBQXNDO0FBRXRDLE1BQU0sTUFBTSxHQUFHLG1CQUFVLENBQUMsU0FBUyxFQUFFLENBQUM7QUFFdEM7O0dBRUc7QUFDSCxNQUFhLEdBQUc7SUFnQ2Q7Ozs7O09BS0c7SUFDSCxZQUNrQixFQUFrQixFQUNsQyxJQUFxQjtRQURMLE9BQUUsR0FBRixFQUFFLENBQWdCO1FBdENwQixTQUFJLEdBQUcsTUFBTSxDQUFDO1FBaUI5Qjs7Ozs7O1dBTUc7UUFDSyxTQUFJLEdBQWEsRUFBRSxDQUFDO1FBRTVCOztXQUVHO1FBQ0ssZ0JBQVcsR0FBcUIsRUFBRSxDQUFDO1FBWXpDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztRQUN0QixJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUM7UUFDaEIsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztRQUNyQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUVqQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDeEIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUM7UUFDckMsSUFBSSxRQUFRLEVBQUUsQ0FBQztZQUNiLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDeEMsQ0FBQztJQUNILENBQUM7SUFFRCxhQUFhO1FBQ1gsaURBQWlEO0lBQ25ELENBQUM7SUFFRCxXQUFXO1FBQ1QsT0FBTyxJQUFJLENBQUMsSUFBSSxJ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