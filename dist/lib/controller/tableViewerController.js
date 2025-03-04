import { loggerStub } from '../logger-stub/logger';
import { ReportConfigurator } from './reportConfigurator';
import { FC } from './formController';
const logger = loggerStub.getLogger();
/**
 * controls a tabular data (rows and columns)
 */
export class TWC {
    fc;
    type = 'table';
    name;
    ac;
    pc;
    /**
     * met-data of the table panel
     */
    table;
    /**
     * viw-component instance associated with this table (e.g. angular component)
     */
    view;
    /**
     * form on which this table is based. It is usually provided, but not mandatory.
     */
    form;
    /**
     * additional information about this table, some of which may change during user interaction.
     * designed to be shared with the view-component for ease of rendering
     */
    info;
    /**
     * data behind this view-component
     * this is THE MODEL that this controller is controlling
     * since the view is for readonly, the data is not modified
     * however, if selection is enables, this additional column is added to the data
     *
     */
    data = [];
    /**
     * list config instance if it is rendered for this table
     */
    reportConfigurator;
    /**
     * selected columns, if user has chosen a subset of columns
     */
    selectedNames;
    currentIdx = -1;
    /**
     * important to note that this constructor is called from the constructor of tableView.
     * TableView MAY NOT be rendered fully. Hence instance of tableView should not be used to invoke any of its methods inside this constructor
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
        const fc = new FC(this.name + 'Config', this.pc, form);
        if (!panel) {
            this.reportConfigurator = new ReportConfigurator(fc, this, this.table);
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
    resetData(fields) {
        this.setData([]);
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
export class TableInfo {
    /**
     * column names that are to be rendered.
     * first column could be the check-bax for selecting the row
     */
    columnNames = [];
    /**
     * labels for the columns to be rendered.
     */
    columnLabels = [];
    /**
     * row is clickable if selection is allowed ii onRowCLick action is set
     */
    rowIsClickable = false;
    /**
     * name of the column mapped to selection status of a row.
     * relevant only if this table is used for selecting rows
     */
    selectColumn;
    /**
     * minimum number of rows to be selected. 0 if no such restrictions
     */
    minRows = 0;
    /**
     * maximum rows to be selected. 0 when no such restriction exists
     */
    maxRows = 0;
    /**
     * total number of rows in this table
     */
    totalRows = 0;
    /**
     * may be used by the view-component to show this.
     */
    nbrSelected = 0;
    /**
     * could be used by the view-component to highlight it
     */
    currentRowIdx = 0;
    /**
     * true there is at least one row in the table, and all rows are selected.
     * false if table has no rows or at least one row not selected
     */
    allSelected = false;
    /**
     * true if at least one row is selected AND at least one is not selected.
     * false if there are no rows, or all rows are selected, or no rows are selected
     */
    someSelected = false;
    /**
     * whether the row is selected or not
     */
    rowSelections = [];
    constructor(meta) {
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
//# sourceMappingURL=tableViewerController.js.map