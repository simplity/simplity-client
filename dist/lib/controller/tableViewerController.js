"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableInfo = exports.TWC = void 0;
const logger_1 = require("../logger-stub/logger");
const reportConfigurator_1 = require("./reportConfigurator");
const formController_1 = require("./formController");
const logger = logger_1.loggerStub.getLogger();
/**
 * controls a tabular data (rows and columns)
 */
class TWC {
    /**
     * important to note that this constructor is called from the constructor of tableView.
     * TableView MAY NOT be rendered fully. Hence instance of tableView should not be used to invoke any of its methods inside this constructor
     * @param fc form controller that manages this table
     * @param view
     */
    constructor(fc, view) {
        this.fc = fc;
        this.type = 'table';
        /**
         * data behind this view-component
         * this is THE MODEL that this controller is controlling
         * since the view is for readonly, the data is not modified
         * however, if selection is enables, this additional column is added to the data
         *
         */
        this.data = [];
        this.currentIdx = -1;
        this.name = view.name;
        this.pc = fc.pc;
        this.ac = this.pc.ac;
        this.view = view;
        this.table = view.table;
        const formName = this.table.formName;
        if (formName) {
            this.form = this.ac.getForm(formName);
        }
        this.info = new TableInfo(this.table);
    }
    getRowData(rowIdx) {
        if (rowIdx === undefined) {
            rowIdx = this.currentIdx === -1 ? 0 : this.currentIdx;
        }
        return this.data[rowIdx];
    }
    getFormName() {
        if (this.form) {
            return this.form.name;
        }
        return undefined;
    }
    createConfig() {
        let form;
        let panel = this.table.configurationPanel;
        if (panel && panel.childFormName) {
            form = this.ac.getForm(panel.childFormName);
        }
        const fc = new formController_1.FC(this.name + 'Config', this.pc, form);
        if (!panel) {
            this.reportConfigurator = new reportConfigurator_1.ReportConfigurator(fc, this, this.table);
            panel = this.reportConfigurator.getConfigPanel();
        }
        return { panel, fc };
    }
    configRendered() {
        this.reportConfigurator.rendered();
    }
    resetColumns(names) {
        if (names && names.length > 0) {
            this.selectedNames = names;
        }
        else {
            this.selectedNames = undefined;
        }
    }
    quickSearch(text) {
        logger.info(`Quick search initiated for text=${text}`);
    }
    receiveData(data) {
        if (Array.isArray(data)) {
            this.setData(data);
            return;
        }
        let arr = data[this.name] || data['list'];
        if (arr && Array.isArray(arr)) {
            this.setData(arr);
            return;
        }
        logger.error(`${this.name} is a table-controller but a non-array data is being set. Data ignored`);
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
        this.info.reset(data);
        this.view.renderData(data, this.selectedNames);
    }
    getData() {
        return this.data;
    }
    rowClicked(rowIdx) {
        const idx = this.sanitizeIdx(rowIdx);
        if (idx === undefined) {
            return;
        }
        this.currentIdx = idx;
        this.info.currentRowIdx = idx;
        if (this.table.onRowClick) {
            this.pc.act(this.table.onRowClick, undefined, this.data[idx]);
        }
    }
    cellClicked(rowIdx, action) {
        const idx = this.sanitizeIdx(rowIdx);
        if (idx === undefined) {
            return;
        }
        this.currentIdx = idx;
        this.info.currentRowIdx = idx;
        this.pc.act(action, undefined, this.data[idx]);
    }
    isValid() {
        return this.validate();
    }
    validate() {
        if (!this.info.selectColumn) {
            return true;
        }
        if (this.info.nbrSelected < this.info.minRows) {
            // todo: flash error message
            logger.error(`At least  ${this.info.minRows} row/s to be selected. You have selected ${this.info.nbrSelected} row/s`);
            return false;
        }
        if (this.info.maxRows && this.info.nbrSelected > this.info.maxRows) {
            // todo: flash error message
            logger.error(`At most  ${this.info.maxRows} row/s to be selected. You have selected ${this.info.nbrSelected} row/s`);
            return false;
        }
        return true;
    }
    sanitizeIdx(idx) {
        if (idx >= 0 && idx < this.data.length) {
            return idx;
        }
        return undefined;
    }
    selectARow(toSelect) {
        const idx = this.info.currentRowIdx;
        if (this.info.selectColumn) {
            this.data[idx][this.info.selectColumn] = toSelect;
        }
        this.info.rowSelectionChanged(idx, toSelect);
        return this.info;
    }
    selectAllRows(toSelect) {
        for (const row of this.data) {
            row[this.table.selectFieldName] = toSelect;
        }
        this.info.selectAllChanged(toSelect);
        return this.info;
    }
    columnClicked(row, action) {
        this.pc.act(action, undefined, row);
    }
    setCurrentRowIdx(rowIdx) {
        const idx = this.sanitizeIdx(rowIdx);
        if (idx !== undefined) {
            this.info.currentRowIdx = rowIdx;
        }
    }
    setDisplayState(_compName, _settings) {
        return false;
    }
}
exports.TWC = TWC;
class TableInfo {
    constructor(meta) {
        /**
         * column names that are to be rendered.
         * first column could be the check-bax for selecting the row
         */
        this.columnNames = [];
        /**
         * labels for the columns to be rendered.
         */
        this.columnLabels = [];
        /**
         * row is clickable if selection is allowed ii onRowCLick action is set
         */
        this.rowIsClickable = false;
        /**
         * minimum number of rows to be selected. 0 if no such restrictions
         */
        this.minRows = 0;
        /**
         * maximum rows to be selected. 0 when no such restriction exists
         */
        this.maxRows = 0;
        /**
         * total number of rows in this table
         */
        this.totalRows = 0;
        /**
         * may be used by the view-component to show this.
         */
        this.nbrSelected = 0;
        /**
         * could be used by the view-component to highlight it
         */
        this.currentRowIdx = 0;
        /**
         * true there is at least one row in the table, and all rows are selected.
         * false if table has no rows or at least one row not selected
         */
        this.allSelected = false;
        /**
         * true if at least one row is selected AND at least one is not selected.
         * false if there are no rows, or all rows are selected, or no rows are selected
         */
        this.someSelected = false;
        /**
         * whether the row is selected or not
         */
        this.rowSelections = [];
        this.minRows = meta.minRows || 0;
        this.maxRows = meta.maxRows || 9999;
        if (meta.selectFieldName) {
            if (meta.onRowClick) {
                throw new Error(`Panel ${meta.name} has both onRowClick and selectColumnName.`);
            }
            this.columnNames.push('_select_');
            this.columnLabels.push('');
        }
        else if (meta.onRowClick) {
            this.rowIsClickable = true;
        }
        this.selectColumn = meta.selectFieldName || undefined;
        if (meta.children) {
            for (const col of meta.children) {
                this.columnNames.push(col.name);
                const c = col;
                //  no header label for buttons
                const label = col.compType === 'field' ? c.label || col.name : '';
                this.columnLabels.push(label);
            }
        }
    }
    rowSelectionChanged(idx, selected) {
        //TODO:
        return;
        if (this.rowSelections[idx] === selected) {
            return;
        }
        this.rowSelections[idx] = selected;
        if (selected) {
            this.nbrSelected++;
            this.someSelected = true;
            if (this.nbrSelected === this.totalRows) {
                this.allSelected = true;
                this.someSelected = false;
            }
        }
        else {
            this.nbrSelected--;
            this.allSelected = false;
            this.someSelected = this.nbrSelected !== 0;
        }
    }
    selectAllChanged(selected) {
        //TODO:
        return;
        if (selected) {
            this.nbrSelected = this.totalRows;
            this.allSelected = true;
        }
        else {
            this.nbrSelected = 0;
            this.allSelected = false;
        }
        this.someSelected = false;
        for (let i = 0; i < this.rowSelections.length; i++) {
            this.rowSelections[i] = selected;
        }
    }
    //not part of the interface. USed  by the controller
    reset(data) {
        //TODO:
        return;
        this.totalRows = data.length;
        this.rowSelections = [];
        this.nbrSelected = 0;
        for (const row of data) {
            if (row[this.selectColumn || '']) {
                this.nbrSelected++;
                this.rowSelections.push(true);
            }
            else {
                this.rowSelections.push(false);
            }
        }
        if (this.nbrSelected === this.totalRows) {
            this.allSelected = true;
            this.someSelected = false;
        }
        else {
            this.allSelected = false;
            this.someSelected = this.nbrSelected > 0;
        }
        this.currentRowIdx = 0;
    }
}
exports.TableInfo = TableInfo;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGVWaWV3ZXJDb250cm9sbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9jb250cm9sbGVyL3RhYmxlVmlld2VyQ29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxrREFBbUQ7QUFhbkQsNkRBQTBEO0FBQzFELHFEQUFzQztBQUV0QyxNQUFNLE1BQU0sR0FBRyxtQkFBVSxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBRXRDOztHQUVHO0FBQ0gsTUFBYSxHQUFHO0lBMkNkOzs7OztPQUtHO0lBQ0gsWUFDa0IsRUFBa0IsRUFDbEMsSUFBcUI7UUFETCxPQUFFLEdBQUYsRUFBRSxDQUFnQjtRQWpEcEIsU0FBSSxHQUFHLE9BQU8sQ0FBQztRQXNCL0I7Ozs7OztXQU1HO1FBQ0ssU0FBSSxHQUFhLEVBQUUsQ0FBQztRQVlwQixlQUFVLEdBQVcsQ0FBQyxDQUFDLENBQUM7UUFXOUIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ3RCLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQztRQUNoQixJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBRWpCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQW9CLENBQUM7UUFDdkMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUM7UUFDckMsSUFBSSxRQUFRLEVBQUUsQ0FBQztZQUNiLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDeEMsQ0FBQztRQUNELElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3hDLENB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