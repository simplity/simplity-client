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
        super(fc, table, 'grid', maxWidth);
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
        rowEle.setAttribute('data-idx', rowIdx.toString());
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGVFZGl0b3JFbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9odG1sL3RhYmxlRWRpdG9yRWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFRQSwrQ0FBNEM7QUFDNUMseUNBQXNDO0FBQ3RDLHFEQUFrRDtBQUVsRCxNQUFhLGtCQUFtQixTQUFRLHlCQUFXO0lBUWpELDZDQUE2QztJQUM3Qyx1REFBdUQ7SUFDdkQsbURBQW1EO0lBRW5ELFlBQ2tCLEVBQWtCLEVBQ2xCLEtBQWtCLEVBQ2xDLFFBQWlCO1FBRWpCLEtBQUssQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztRQUpuQixPQUFFLEdBQUYsRUFBRSxDQUFnQjtRQUNsQixVQUFLLEdBQUwsS0FBSyxDQUFhO1FBS2xDOztXQUVHO1FBQ0gsSUFBSSxDQUFDLFFBQVEsR0FBRyxtQkFBUSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBRTdEOztXQUVHO1FBQ0gsSUFBSSxDQUFDLFlBQVksR0FBRyxtQkFBUSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBRWxFOztXQUVHO1FBQ0gsSUFBSSxDQUFDLE9BQU8sR0FBRyxtQkFBUSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBZ0IsQ0FBQztRQUUxRTs7V0FFRztRQUNILElBQUksQ0FBQyxVQUFVLEdBQUcsbUJBQVEsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM3RCxNQUFNLEdBQUcsR0FBRyxtQkFBUSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQzlELElBQUksS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3pCLEdB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