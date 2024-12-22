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
    constructor(fc, comp) {
        super(fc, comp, 'grid');
        this.fc = fc;
        this.comp = comp;
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
        if (comp.rowsCanBeAdded) {
            btn.addEventListener('click', () => {
                console.info(`add row clicked for ${this.comp.name}`);
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
        for (const column of this.comp.children) {
            const cellEle = this.dataCellEle.cloneNode(true);
            let value = values && values[column.name];
            if (this.comp.editable) {
                const field = elementFactory_1.elementFactory.newElement(fc, column, value, true);
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
        for (const column of this.comp.children) {
            const ele = this.headerCellEle.cloneNode(true);
            htmlUtil_1.htmlUtil.appendText(ele, column.label || '');
            this.headerRowEle.appendChild(ele);
        }
    }
}
exports.TableEditorElement = TableEditorElement;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGVFZGl0b3JFbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9odG1sL3RhYmxlRWRpdG9yRWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFPQSwrQ0FBNEM7QUFDNUMseUNBQXNDO0FBQ3RDLHFEQUFrRDtBQUVsRCxNQUFhLGtCQUFtQixTQUFRLHlCQUFXO0lBUWpELDZDQUE2QztJQUM3Qyx1REFBdUQ7SUFDdkQsbURBQW1EO0lBRW5ELFlBQ2tCLEVBQWtCLEVBQ2xCLElBQWlCO1FBRWpDLEtBQUssQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBSFIsT0FBRSxHQUFGLEVBQUUsQ0FBZ0I7UUFDbEIsU0FBSSxHQUFKLElBQUksQ0FBYTtRQUlqQzs7V0FFRztRQUNILElBQUksQ0FBQyxRQUFRLEdBQUcsbUJBQVEsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUU3RDs7V0FFRztRQUNILElBQUksQ0FBQyxZQUFZLEdBQUcsbUJBQVEsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztRQUVsRTs7V0FFRztRQUNILElBQUksQ0FBQyxPQUFPLEdBQUcsbUJBQVEsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLENBQWdCLENBQUM7UUFFMUU7O1dBRUc7UUFDSCxJQUFJLENBQUMsVUFBVSxHQUFHLG1CQUFRLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDN0QsTUFBTSxHQUFHLEdBQUcsbUJBQVEsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsQ0FBQztRQUM5RCxJQUFJLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUN4QixHQUFHLENBQUMsZ0JBQWdCLENBQUMsT0FB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