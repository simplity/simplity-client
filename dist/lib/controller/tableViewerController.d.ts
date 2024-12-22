import { AppController, Form, PageController, TableViewer, TableViewerView, Values, Vo, TableViewerController, Panel, FormController } from 'simplity-types';
/**
 * controls a tabular data (rows and columns)
 */
export declare class TWC implements TableViewerController {
    readonly fc: FormController;
    readonly type = "table";
    readonly name: string;
    readonly ac: AppController;
    readonly pc: PageController;
    /**
     * met-data of the table panel
     */
    private readonly table;
    /**
     * viw-component instance associated with this table (e.g. angular component)
     */
    private readonly view;
    /**
     * form on which this table is based. It is usually provided, but not mandatory.
     */
    readonly form?: Form;
    /**
     * additional information about this table, some of which may change during user interaction.
     * designed to be shared with the view-component for ease of rendering
     */
    private readonly info;
    /**
     * data behind this view-component
     * this is THE MODEL that this controller is controlling
     * since the view is for readonly, the data is not modified
     * however, if selection is enables, this additional column is added to the data
     *
     */
    private data;
    /**
     * list config instance if it is rendered for this table
     */
    private reportConfigurator?;
    /**
     * selected columns, if user has chosen a subset of columns
     */
    private selectedNames?;
    /**
     * retain the child maps for re-use once it is built
     */
    private childrenMap?;
    private columnsMap?;
    private selectedChildren?;
    private selectedColumns?;
    /**
     * important to note that this constructor is called from the constructor of tableView.
     * TableView MAY NOT be rendered fully. Hence instance of tableView should not be used to invoke any of its methods inside this constructor
     * @param fc form controller that manages this table
     * @param view
     */
    constructor(fc: FormController, view: TableViewerView);
    getFormName(): string | undefined;
    createConfig(): {
        panel: Panel;
        fc: FormController;
    };
    configRendered(): void;
    resetColumns(names?: string[]): void;
    quickSearch(text: string): void;
    receiveData(data: Vo | Vo[]): void;
    setData(data: Values[]): void;
    getData(): Values[];
    rowClicked(rowIdx: number): void;
    isValid(): boolean;
    validate(): boolean;
    private sanitizeIdx;
    selectARow(toSelect: boolean): TableInfo;
    selectAllRows(toSelect: boolean): TableInfo;
    columnClicked(row: Vo, action: string): void;
    setCurrentRowIdx(rowIdx: number): void;
    private getChildrenList;
    private getColumnList;
}
export declare class TableInfo {
    /**
     * column names that are to be rendered.
     * first column could be the check-bax for selecting the row
     */
    columnNames: string[];
    /**
     * labels for the columns to be rendered.
     */
    columnLabels: string[];
    /**
     * row is clickable if selection is allowed ii onRowCLick action is set
     */
    rowIsClickable: boolean;
    /**
     * name of the column mapped to selection status of a row.
     * relevant only if this table is used for selecting rows
     */
    selectColumn?: string;
    /**
     * minimum number of rows to be selected. 0 if no such restrictions
     */
    minRows: number;
    /**
     * maximum rows to be selected. 0 when no such restriction exists
     */
    maxRows: number;
    /**
     * total number of rows in this table
     */
    totalRows: number;
    /**
     * may be used by the view-component to show this.
     */
    nbrSelected: number;
    /**
     * could be used by the view-component to highlight it
     */
    currentRowIdx: number;
    /**
     * true there is at least one row in the table, and all rows are selected.
     * false if table has no rows or at least one row not selected
     */
    allSelected: boolean;
    /**
     * true if at least one row is selected AND at least one is not selected.
     * false if there are no rows, or all rows are selected, or no rows are selected
     */
    someSelected: boolean;
    /**
     * whether the row is selected or not
     */
    rowSelections: boolean[];
    constructor(meta: TableViewer);
    rowSelectionChanged(idx: number, selected: boolean): void;
    selectAllChanged(selected: boolean): void;
    reset(data: Vo[]): void;
}
