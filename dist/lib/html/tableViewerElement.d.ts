import { TableViewer, TableViewerController, Values, TableViewerView, FormController } from 'simplity-types';
import { BaseElement } from './baseElement';
export declare class TableViewerElement extends BaseElement implements TableViewerView {
    readonly fc: FormController;
    readonly table: TableViewer;
    readonly twc: TableViewerController;
    /**
     * components of this panel
     */
    private readonly tableEle;
    private readonly configEle;
    private readonly rowsEle;
    private readonly headerRowEle;
    private readonly dataRowEle;
    private readonly headerCellEle;
    private readonly dataCellEle;
    private allTrs;
    /**
     * how to render the column headers and column Values?
     */
    private columnDetails?;
    /**
     * populated if headerDetails is added. Else will remain empty
     */
    private readonly columnDetailsMap;
    /**
     * what features are enabled?
     */
    private searchable;
    private readonly sortable;
    private configurable;
    /**
     * for implementing search feature
     */
    private readonly searchEle?;
    private searchInputEle?;
    private lastSearched;
    private readonly searchData;
    private readonly hiddenRows;
    /**
     * for implementing sort feature
     */
    private data?;
    /**
     * thead elements mapped by column name
     */
    private columnHeaders;
    private sortedOn;
    private sortedRows;
    private sortedAscending;
    constructor(fc: FormController, table: TableViewer, maxWidth: number);
    private renderHeaders;
    /**
     *
     * @param data
     * @param columnNames is specified, we are to render these columns, in that order
     */
    renderData(data: Values[], columnNames?: string[]): void;
    private renderRows;
    private addTd;
    private addTdForComp;
    /**
     * remove all rows that are rendered. Remove the header if it is dynamic
     */
    reset(headerAsWell?: boolean): void;
    private addTr;
    private addTh;
    /**
     * we assume that all the rows have the same set of fields/columns
     * @param data
     */
    private getDynamicHeader;
    private initConfig;
    private initSearch;
    /**
     *
     * @returns
     */
    private search;
    private resetSearch;
    private freshSearch;
    private searchFurther;
    sort(column: string): void;
    private reverseRows;
    private sortRows;
}
