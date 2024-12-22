import { AppController, Form, PageController, TableEditorView, Values, DisplaySettings, TableEditorController, Vo, FormController } from 'simplity-types';
/**
 * controls a tabular data (rows and columns)
 */
export declare class TEC implements TableEditorController {
    readonly fc: FormController;
    readonly type = "grid";
    readonly name: string;
    readonly ac: AppController;
    readonly pc: PageController;
    /**
     * form on which this table is based. It is usually provided, but not mandatory.
     */
    readonly form?: Form;
    /**
     * met-data of the table panel
     */
    private readonly table;
    /**
     * viw-component instance associated with this table (e.g. angular component)
     */
    private readonly view;
    /**
     * data behind this view-component
     * this is THE MODEL that this controller is controlling
     * since the view is for readonly, the data is not modified
     * however, if selection is enables, this additional column is added to the data
     *
     */
    private data;
    /**
     * data controllers, one per row, but only if this is an editable table
     */
    private controllers;
    /**
     * important to note that this constructor is called from the constructor of tableView.
     * TableView MAY NOPT be rendered fully. Hence instance of tableView should not be used to invoke any of its methods inside this constructor
     * @param fc form controller that manages this table
     * @param view
     */
    constructor(fc: FormController, view: TableEditorView);
    tableRendered(): void;
    getFormName(): string | undefined;
    receiveData(data: Vo | Vo[]): void;
    setData(data: Values[]): void;
    appendRow(values?: Values): number;
    private doAppend;
    getData(): Values[];
    getColumnValues(names: string[], rowId: number): Values;
    setColumnValues(values: Values, rowId: number): void;
    rowClicked(rowIdx: number): void;
    private warn;
    isValid(): boolean;
    /**
     * validate all editable components again
     * @returns true is all editable components are valid. false otherwise
     */
    validate(): boolean;
    private sanitizeIdx;
    changeColumnSettings(_names: string[], _settings: DisplaySettings, _rowId?: number): void;
    changeCellSettings(_columnNames: string[], _settings: DisplaySettings, _rowId?: number): void;
}
