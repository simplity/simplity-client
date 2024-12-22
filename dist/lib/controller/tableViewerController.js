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
    //private currentIdx: number = -1;
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
        this.name = view.name;
        this.pc = fc.pc;
        this.ac = this.pc.ac;
        this.view = view;
        this.table = view.comp;
        const formName = this.table.formName;
        if (formName) {
            this.form = this.ac.getForm(formName);
        }
        this.info = new TableInfo(this.table);
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
        //reset cached arrays as well
        this.selectedChildren = undefined;
        this.selectedColumns = undefined;
    }
    quickSearch(text) {
        logger.info(`Quick search initiated for text=${text}`);
    }
    receiveData(data) {
        if (Array.isArray(data)) {
            this.setData(data);
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
        this.view.reset();
        if (data.length == 0) {
            return;
        }
        if (this.table.children) {
            /**
             * ensure that the child elements are not registered with any DC
             */
            this.view.renderChildren(data, this.getChildrenList());
            return;
        }
        if (this.table.columns) {
            this.view.renderData(data, this.getColumnList());
            return;
        }
        //dynamic columns
        this.view.showData(data);
    }
    getData() {
        return this.data;
    }
    rowClicked(rowIdx) {
        const idx = this.sanitizeIdx(rowIdx);
        if (idx === undefined) {
            return;
        }
        //this.currentIdx = idx;
        this.info.currentRowIdx = idx;
        if (this.table.onRowClick) {
            this.pc.act(this.table.onRowClick, undefined, this.data[idx]);
        }
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
    getChildrenList() {
        /**
         * if user has not selected a sub-set, the original array will do
         */
        if (!this.selectedNames) {
            return this.table.children || [];
        }
        /**
         * is the list ready?
         */
        if (this.selectedChildren) {
            return this.selectedChildren;
        }
        /**
         * get the map if we have not done it earlier
         */
        if (!this.childrenMap) {
            this.childrenMap = {};
            for (const child of this.table.children || []) {
                this.childrenMap[child.name] = child;
            }
        }
        this.selectedChildren = [];
        for (const name of this.selectedNames) {
            const child = this.childrenMap[name];
            if (child) {
                this.selectedChildren.push(child);
            }
            else {
                logger.error(`${name} is not defined as a child-column in the table-panel ${this.name} but is being selected as a column to be rendered. Ignored`);
            }
        }
        return this.selectedChildren;
    }
    getColumnList() {
        /**
         * if user has not selected a sub-set, the original array will do
         */
        if (!this.selectedNames) {
            return this.table.columns || [];
        }
        /**
         * is the list ready?
         */
        if (this.selectedColumns) {
            return this.selectedColumns;
        }
        /**
         * get the map if we have not done it earlier
         */
        if (!this.columnsMap) {
            this.columnsMap = {};
            for (const column of this.table.columns || []) {
                this.columnsMap[column.name] = column;
            }
        }
        this.selectedColumns = [];
        for (const name of this.selectedNames) {
            const column = this.columnsMap[name];
            if (column) {
                this.selectedColumns.push(column);
            }
            else {
                logger.error(`${name} is not defined as a child-column in the table-panel ${this.name} but is being selected as a column to be rendered. Ignored`);
            }
        }
        return this.selectedColumns;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGVWaWV3ZXJDb250cm9sbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9jb250cm9sbGVyL3RhYmxlVmlld2VyQ29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxrREFBbUQ7QUFnQm5ELDZEQUEwRDtBQUMxRCxxREFBc0M7QUFFdEMsTUFBTSxNQUFNLEdBQUcsbUJBQVUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUV0Qzs7R0FFRztBQUNILE1BQWEsR0FBRztJQWtEZCxrQ0FBa0M7SUFDbEM7Ozs7O09BS0c7SUFDSCxZQUNrQixFQUFrQixFQUNsQyxJQUFxQjtRQURMLE9BQUUsR0FBRixFQUFFLENBQWdCO1FBekRwQixTQUFJLEdBQUcsT0FBTyxDQUFDO1FBc0IvQjs7Ozs7O1dBTUc7UUFDSyxTQUFJLEdBQWEsRUFBRSxDQUFDO1FBK0IxQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDdEIsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDO1FBQ2hCLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7UUFDckIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFFakIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBbUIsQ0FBQztRQUN0QyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQztRQUNyQyxJQUFJLFFBQVEsRUFBRSxDQUFDO1lBQ2IsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN4QyxDQUFDO1FBQ0QsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDeEMsQ0FBQztJQUVNLFdBQVc7UUFD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