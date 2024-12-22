import { TableEditor, TableEditorView, Values, FormController } from 'simplity-types';
import { BaseElement } from './baseElement';
export declare class TableEditorElement extends BaseElement implements TableEditorView {
    readonly fc: FormController;
    readonly comp: TableEditor;
    private tec;
    private tableEle;
    private rowsEle;
    private headerRowEle;
    private dataRowEle;
    private headerCellEle;
    private dataCellEle;
    constructor(fc: FormController, comp: TableEditor);
    /**
     * remove all rows that are rendered
     */
    reset(): void;
    /**
     * render an additional row, possibly with data.
     * for list(read-only) it's always with data.
     * for a grid, this could be an empty row to add data for a new row
     * @param fc form controller that manages this row
     * @param rowIdx 0-based index of this row in the data-array.
     * the row in the view is marked with this index
     * @param values optional values to set to the view-components
     */
    appendRow(fc: FormController, rowIdx: number, values?: Values): void;
    private renderHeader;
}
