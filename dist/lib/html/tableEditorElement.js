"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableEditorElement = void 0;
const baseElement_1 = require("./baseElement");
const htmlUtil_1 = require("./htmlUtil");
const elementFactory_1 = require("./elementFactory");
class TableEditorElement extends baseElement_1.BaseElement {
    //private configEle: HTMLElement | undefined;
    //private currentConfig: ListConfiguration | undefined;
    //private Configs: ListConfiguration[] | undefined;
    constructor(fc, table, maxWidth) {
        super(fc, table, 'table-editable', maxWidth);
        this.fc = fc;
        this.table = table;
        /**
         * typically <Table>
         */
        this.tableEle = htmlUtil_1.htmlUtil.getChildElement(this.root, 'table');
        /**
         * typically <thead> -> <tr>
         */
        this.headerRowEle = htmlUtil_1.htmlUtil.getChildElement(this.root, 'header');
        /**
         * typically <tbody>
         */
        this.rowsEle = htmlUtil_1.htmlUtil.getChildElement(this.root, 'rows');
        /**
         * typically <tbody> -> <tr>
         */
        this.dataRowEle = htmlUtil_1.htmlUtil.getChildElement(this.root, 'row');
        const btn = htmlUtil_1.htmlUtil.getChildElement(this.root, 'add-button');
        if (table.rowsCanBeAdded) {
            btn.addEventListener('click', () => {
                console.info(`add row clicked for ${this.table.name}`);
                this.tec.appendRow();
            });
        }
        else {
            btn.remove();
        }
        /**
         * we expect the header row to have just one cell. We use that for cloning
         */
        this.headerCellEle = this.headerRowEle.children[0];
        this.headerCellEle.remove();
        /**
         * we expect only one cell in the only row. We use both the row and the cell for cloning
         */
        this.dataCellEle = this.dataRowEle.children[0];
        this.dataCellEle.remove();
        this.dataRowEle.remove();
        this.renderHeader();
        this.tec = this.fc.newTableEditorController(this);
        this.tableEle;
    }
    /**
     * remove all rows that are rendered
     */
    reset() {
        htmlUtil_1.htmlUtil.removeChildren(this.rowsEle);
    }
    /**
     * render an additional row, possibly with data.
     * for list(read-only) it's always with data.
     * for a grid, this could be an empty row to add data for a new row
     * @param fc form controller that manages this row
     * @param rowIdx 0-based index of this row in the data-array.
     * the row in the view is marked with this index
     * @param values optional values to set to the view-components
     */
    appendRow(fc, rowIdx, values) {
        const rowEle = this.dataRowEle.cloneNode(true);
        htmlUtil_1.htmlUtil.setViewState(rowEle, 'idx', rowIdx);
        for (const column of this.table.children) {
            const cellEle = this.dataCellEle.cloneNode(true);
            let value = values && values[column.name];
            if (this.table.editable) {
                const field = elementFactory_1.elementFactory.newElement(fc, column, 0, value);
                cellEle.appendChild(field.root);
            }
            else {
                if (value === undefined) {
                    value = '';
                }
                else {
                    value = '' + value;
                }
                htmlUtil_1.htmlUtil.appendText(cellEle, value);
            }
            rowEle.appendChild(cellEle);
        }
        this.rowsEle.appendChild(rowEle);
    }
    renderHeader() {
        for (const column of this.table.children) {
            const ele = this.headerCellEle.cloneNode(true);
            htmlUtil_1.htmlUtil.appendText(ele, column.label || '');
            this.headerRowEle.appendChild(ele);
        }
    }
}
exports.TableEditorElement = TableEditorElement;
//# sourceMappingURL=tableEditorElement.js.map