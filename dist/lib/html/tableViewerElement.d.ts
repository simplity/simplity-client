import { TableViewer, Values, TableViewerView, LeafComponent, ValueRenderingDetails, FormController, NbrCols } from 'simplity-types';
import { BaseElement } from './baseElement';
export declare class TableViewerElement extends BaseElement implements TableViewerView {
    readonly fc: FormController;
    readonly table: TableViewer;
    private twc;
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
    constructor(fc: FormController, table: TableViewer, maxWidth: NbrCols);
    showData(data: Values[]): void;
    private addTd;
    renderData(data: Values[], columns: ValueRenderingDetails[]): void;
    private formatColumnValue;
    renderChildren(data: Values[], columns: LeafComponent[]): void;
    /**
     * remove all rows that are rendered. Remove the header as well
     */
    reset(): void;
    private addTr;
    private addTh;
    private renderHeaderForChildren;
    /**
     * we assume that all the rows have the same set of fields/columns
     * @param data
     */
    private renderDynamicHeaders;
    private renderHeaderForColumns;
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
