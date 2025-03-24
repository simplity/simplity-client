import {
  TableViewer,
  TableViewerController,
  Values,
  TableViewerView,
  StringMap,
  LeafComponent,
  ValueRenderingDetails,
  DataField,
  FormatterFunction,
  FormController,
  Value,
  Markups,
  StaticComp,
  Button,
} from 'simplity-types';
import { BaseElement } from './baseElement';
import { htmlUtil, ViewState } from './htmlUtil';
import { elementFactory } from './elementFactory';
import { LeafElement } from './leafElement';
import { FieldElement } from './fieldElement';

type SortedRow = { idx: number; value: Value };
type HeaderDetails = ValueRenderingDetails & { comp?: Button | StaticComp };
export class TableViewerElement extends BaseElement implements TableViewerView {
  public readonly twc: TableViewerController;
  /**
   * components of this panel
   */
  private readonly tableEle: HTMLElement;
  private readonly configEle: HTMLElement;
  private readonly rowsEle: HTMLElement;
  private readonly headerRowEle: HTMLElement;
  private readonly dataRowEle: HTMLElement;
  private readonly headerCellEle: HTMLElement;
  private readonly dataCellEle: HTMLElement;
  private allTrs: HTMLElement[] = [];

  /**
   * how to render the column headers and column Values?
   */
  private columnDetails?: HeaderDetails[];

  /**
   * populated if headerDetails is added. Else will remain empty
   */
  private readonly columnDetailsMap: StringMap<HeaderDetails> = {};

  /**
   * what features are enabled?
   */
  private searchable: boolean;
  private readonly sortable: boolean;
  private configurable: boolean;

  /**
   * for implementing search feature
   */
  private readonly searchEle?: HTMLElement;
  private searchInputEle?: HTMLInputElement;
  private lastSearched = '';
  private readonly searchData: string[] = [];
  private readonly hiddenRows: boolean[] = [];

  /**
   * for implementing sort feature
   */
  private data?: Values[];
  /**
   * thead elements mapped by column name
   */
  private columnHeaders: StringMap<HTMLElement> = {};
  private sortedOn = ''; //column on which  this table is sorted
  private sortedRows: SortedRow[] = [];
  private sortedAscending = false;

  constructor(
    public readonly fc: FormController,
    public readonly table: TableViewer,
    maxWidth: number
  ) {
    super(fc, table, 'table', maxWidth);

    this.sortable = !!table.sortable;
    this.searchable = !!table.searchable;
    this.configurable = !!table.configurable;

    /**
     * typically <Table>
     */
    this.tableEle = htmlUtil.getChildElement(this.root, 'table');

    /**
     * typically <thead> -> <tr>
     */
    this.headerRowEle = htmlUtil.getChildElement(this.root, 'header');

    /**
     * typically <tbody>
     */
    this.rowsEle = htmlUtil.getChildElement(this.root, 'rows') as HTMLElement;

    /**
     * typically <tbody> -> <tr>
     */
    this.dataRowEle = htmlUtil.getChildElement(this.root, 'row');

    this.searchEle = htmlUtil.getOptionalElement(
      this.root,
      'search'
    ) as HTMLElement;

    this.configEle = htmlUtil.getOptionalElement(
      this.root,
      'list-config'
    ) as HTMLElement;

    /**
     * we expect the header row to have just one cell. We use that for cloning
     */
    let ele = this.headerRowEle.children[0] as HTMLElement;
    ele.remove();
    if (table.sortable) {
      ele = htmlUtil.newHtmlElement('sortable-header');
    }
    this.headerCellEle = ele;

    /**
     * we expect only one cell in the only row. We use both the row and the cell for cloning
     */
    this.dataCellEle = this.dataRowEle.children[0] as HTMLElement;
    this.dataCellEle.remove();
    this.dataRowEle.remove();

    if (this.table.onRowClick) {
      htmlUtil.setViewState(this.tableEle, 'clickable', true);
    }

    if (table.selectFieldName) {
      htmlUtil.setViewState(this.tableEle, 'selectable', true);
    }

    this.twc = this.fc.newTableViewerController(this);

    this.initSearch();
    this.initConfig();
    const details = this.createHeaderDetails();
    if (details) {
      this.columnDetails = details;
      /**
       * populate the map for look-up purpose for dynamic columns
       */
      for (const col of details) {
        this.columnDetailsMap[col.name] = col;
      }
      this.renderHeaders(details);
    }
  }

  /////////////////// methods to render rows

  private createHeaderDetails(): HeaderDetails[] | undefined {
    //readily available on a platter?
    if (this.table.columns) {
      return this.table.columns;
    }

    const details: HeaderDetails[] = [];
    if (this.table.children) {
      //infer from child components
      for (const child of this.table.children) {
        let field =
          child.compType === 'field' || child.compType === 'referred'
            ? (child as DataField)
            : undefined;

        if (field && field.hideInList) {
          continue;
        }

        const hd: HeaderDetails = {
          name: child.name,
          label: child.label || htmlUtil.toLabel(child.name),
          valueType: 'text',
        };
        if (field) {
          hd.valueType = field.valueType;
          hd.labelAttributes = field.labelAttributes;
          hd.valueFormatter = field.valueFormatter;
          hd.formattingFn = field.formattingFn;
          hd.onClick = field.onClick;
        } else {
          hd.comp = child as StaticComp | Button;
        }
        details.push(hd);
      }
      return details;
    }

    /**
     * as per the current dev-util, this should not arise because children will be added based on the form.
     * this is just a defensive code??
     */
    if (this.table.formName) {
      //if form is given, we assume all the fields in the form
      const form = this.ac.getForm(this.table.formName);
      for (const name of form.fieldNames) {
        const field = form.fields[name]!;

        if (field.renderAs === 'hidden') {
          continue;
        }

        details.push({
          name,
          label: field.label || htmlUtil.toLabel(field.name),
          valueType: field.valueType,
          labelAttributes: field.labelAttributes,
          valueFormatter: field.valueFormatter,
          formattingFn: field.formattingFn,
          onClick: field.onClick,
        });
      }
      return details;
    }

    this.logger.info(
      `Table ${this.name} has no design-time columns. 
        Hence the header row is not rendered onload.
        columns will be rendered as and when data is received`
    );
    return undefined;
  }

  private renderHeaders(cols: HeaderDetails[]): void {
    for (const col of cols) {
      const isNumeric =
        col.valueType === 'integer' || col.valueType === 'decimal';
      this.addTh(col.name, isNumeric, col.label);
    }
  }

  /**
   *
   * @param data
   * @param columnNames is specified, we are to render these columns, in that order
   */
  renderData(data: Values[], columnNames?: string[]): void {
    this.data = data;
    /**
     * header has to be re-rendered if it is not specified at design-time or we are to render a subset of the columns
     */
    const reRenderHeader =
      columnNames !== undefined || this.columnDetails === undefined;
    this.reset(reRenderHeader);

    /**
     * If headers are ready, and no dynamic columns, it's simple
     */

    if (this.columnDetails && columnNames === undefined) {
      this.renderRows(data, this.columnDetails);
      return;
    }

    const cols = this.getDynamicHeader(data, columnNames);
    this.renderHeaders(cols);
    this.renderRows(data, cols);
  }

  private renderRows(data: Values[], cols: HeaderDetails[]): void {
    let idx = -1;
    for (const row of data) {
      idx++;
      /**
       * search row has  all the column values joined in it as a string
       */
      const searchRow: string[] = [];
      const rowEle = this.addTr(idx);

      for (const col of cols) {
        const value = row[col.name];
        const textValue = this.formatColumnValue(value, col, row);

        if (col.comp) {
          //comp is a static element.
          this.addTdForComp(textValue, col.comp, rowEle, searchRow);
          continue;
        }

        const isNumeric =
          col.valueType === 'integer' || col.valueType === 'decimal';
        const td = this.addTd(textValue, isNumeric, rowEle, searchRow);
        if (col.onClick) {
          htmlUtil.setViewState(td, 'clickable', true);
          td.addEventListener('click', () => {
            this.twc.cellClicked(idx, col.onClick!);
          });
        }
        if (col.formattingFn) {
          const fn = this.ac.getFn(col.formattingFn, 'format')
            .fn as FormatterFunction;
          const fd = fn(value, row);
          if (fd.markups) {
            for (const [name, attr] of Object.entries(fd.markups as Markups)) {
              htmlUtil.setViewState(td, name as ViewState, attr);
            }
          }
        }
      }

      this.searchData.push(searchRow.join('\n'));
      this.rowsEle.appendChild(rowEle);
    }
  }

  private addTd(
    value: string,
    isNumeric: boolean,
    rowEle: HTMLElement,
    searchRow: string[]
  ): HTMLElement {
    const td = this.dataCellEle.cloneNode(true) as HTMLElement;
    htmlUtil.appendText(td, value);
    if (isNumeric) {
      htmlUtil.setViewState(td, 'align', 'right');
    }

    rowEle.appendChild(td);
    if (value) {
      searchRow.push(value.toLowerCase());
    }

    return td;
  }

  private addTdForComp(
    value: string,
    leafComp: LeafComponent,
    rowEle: HTMLElement,
    searchRow: string[]
  ): void {
    const td = this.dataCellEle.cloneNode(true) as HTMLElement;
    let ele: BaseElement | undefined;

    if (leafComp.compType === 'range') {
      return;
    }
    if (leafComp.compType === 'field' || leafComp.compType === 'referred') {
      //fields have to be rendered as output
      const df = { ...leafComp } as DataField;
      df.renderAs = 'output';
      ele = new FieldElement(undefined, df, 0);
    } else {
      ele = new LeafElement(undefined, leafComp, 0);
    }
    td.appendChild(ele.root);

    rowEle.appendChild(td);
    if (value) {
      searchRow.push(value.toLowerCase());
    }
  }

  private formatColumnValue(
    value: Value,
    vrd: HeaderDetails,
    row: Values
  ): string {
    if (vrd.formattingFn) {
      const fn = this.ac.getFn(vrd.formattingFn, 'format')
        .fn as FormatterFunction;
      const fd = fn(value, row);
      return fd.value;
    }
    if (vrd.valueFormatter) {
      return htmlUtil.formatValue(value, vrd.valueFormatter);
    }
    if (value === undefined) {
      return '';
    }
    return '' + value;
  }

  /**
   * remove all rows that are rendered. Remove the header if it is dynamic
   */
  public reset(headerAsWell?: boolean) {
    this.rowsEle.innerHTML = '';
    this.allTrs = [];
    this.sortedRows = [];
    this.searchData.length = 0;

    /**
     * header row is also reset if this is a configurable table
     */
    if (headerAsWell) {
      this.columnHeaders = {};
      this.headerRowEle.innerHTML = '';
    }
  }

  private addTr(idx: number): HTMLElement {
    const ele = this.dataRowEle.cloneNode(true) as HTMLElement;
    htmlUtil.setViewState(ele, 'idx', idx);
    /**
     * Controller needs to know WHENEVER a row is clicked.
     * as a minimum, the controller has to track "current row"
     */

    ele.addEventListener('click', () => {
      this.twc.rowClicked(idx);
    });

    this.allTrs.push(ele);
    return ele;
  }

  private addTh(name: string, isNumeric: boolean, label: string): HTMLElement {
    const ele = this.headerCellEle.cloneNode(true) as HTMLElement;
    this.columnHeaders[name] = ele;
    if (isNumeric) {
      htmlUtil.setViewState(ele, 'align', 'right');
    }
    if (this.sortable) {
      ele.addEventListener('click', () => {
        this.sort(name);
      });
    }
    const labelEle = htmlUtil.getOptionalElement(ele, 'label') || ele;
    htmlUtil.appendText(labelEle, label);
    this.headerRowEle.appendChild(ele);
    return ele;
  }

  /**
   * we assume that all the rows have the same set of fields/columns
   * @param data
   */
  private getDynamicHeader(data: Values[], names?: string[]): HeaderDetails[] {
    let allCols = this.columnDetails;
    //no predefined columns. create them based on the first row
    if (!allCols) {
      allCols = [];
      if (!data.length) {
        //no predefined columns, and no data rows!!
        allCols.push({
          name: '',
          label: 'No data for the selected filters',
          valueType: 'text',
        });
        return allCols;
      }

      for (const [name, value] of Object.entries(data[0])) {
        allCols.push({
          name,
          valueType: typeof value === 'number' ? 'integer' : 'text',
          label: htmlUtil.toLabel(name),
        });
      }
    }

    if (!names) {
      return allCols;
    }

    const cols: HeaderDetails[] = [];

    for (const name of names) {
      const d = this.columnDetailsMap![name];
      if (d) {
        cols.push(d);
      } else {
        this.logger
          .error(`Column '${name}' is requested at run time, but that is not a valid field/child/column as per design time parameters.
          Column is not rendered`);
      }
    }

    return cols;
  }

  private initConfig() {
    if (!this.configEle) {
      if (this.configurable) {
        this.logger.error(
          'HTML template for table-view does not have a container with data-id="list-config" but the table is marked for dynamic configuration'
        );
        this.configurable = false;
      }
      return;
    }

    if (!this.configurable) {
      this.configEle.style.display = 'none';

      return;
    }
    const { panel, fc } = this.twc.createConfig();
    const configEle = elementFactory.newElement(fc, panel, this.maxWidth);
    this.configEle.appendChild(configEle.root);
    this.twc.configRendered();
    return;
  }

  ///////////// methods for search feature
  private initSearch(): void {
    if (!this.searchEle) {
      if (this.searchable) {
        this.logger
          .error(`Table Viewer Element has no element with data-search, implying that it is not designed for quick search feature. 
          However table "${this.name}" requires this feature. Feature ignored`);
        this.searchable = false;
      }
      return;
    }

    if (!this.searchable) {
      this.searchEle.style.display = 'none';
      return;
    }

    let input: HTMLElement | undefined;
    const tagName = this.searchEle.tagName.toUpperCase();
    if (tagName === 'INPUT') {
      input = this.searchEle;
    } else {
      input = this.searchEle.querySelector('input') as HTMLElement;
      if (!input) {
        this.logger.error(
          `html template for table-viewer has no input element in its search element`
        );
        this.searchable = false;
        return;
      }
    }

    this.searchInputEle = input as HTMLInputElement;
    input.addEventListener('input', () => {
      this.search();
    });
  }
  /**
   *
   * @returns
   */
  private search() {
    if (!this.searchData || !this.searchData.length) {
      return;
    }
    const text = this.searchInputEle!.value;
    if (text === this.lastSearched) {
      return;
    }

    if (!text) {
      this.resetSearch();
    } else if (this.lastSearched && text.startsWith(this.lastSearched)) {
      this.searchFurther(text);
    } else {
      this.freshSearch(text);
    }

    this.lastSearched = text;
  }

  private resetSearch() {
    for (let ele = this.rowsEle.firstChild; ele; ele = ele.nextSibling) {
      (ele as HTMLElement).style.display = '';
    }
    this.hiddenRows.length = 0;
    this.searchInputEle!.value = '';
  }

  private freshSearch(text: string) {
    text = text.trim().toLowerCase();
    let idx = -1;
    for (let ele = this.rowsEle.firstChild; ele; ele = ele.nextSibling) {
      idx++;
      const isShown = !this.hiddenRows[idx];
      const toShow = this.searchData[idx].includes(text);
      if (toShow !== isShown) {
        if (toShow) {
          (ele as HTMLElement).style.display = '';
          this.hiddenRows[idx] = false;
        } else {
          (ele as HTMLElement).style.display = 'none';
          this.hiddenRows[idx] = true;
        }
      }
    }
  }

  private searchFurther(text: string) {
    let idx = -1;
    for (let ele = this.rowsEle.firstChild; ele; ele = ele.nextSibling) {
      idx++;
      if (!this.hiddenRows[idx]) {
        if (!this.searchData[idx].includes(text)) {
          (ele as HTMLElement).style.display = 'none';
          this.hiddenRows[idx] = true;
        }
      }
    }
  }

  /////////// methods for sort feature
  sort(column: string) {
    if (!this.data || !this.data.length) {
      return;
    }

    const th = this.columnHeaders[column];
    if (!th) {
      this.logger.error(
        `This table has no column named ${column}. sort command ignored`
      );
      return;
    }

    if (this.sortedOn === column) {
      this.reverseRows();
      this.sortedAscending = !this.sortedAscending;
      htmlUtil.setViewState(
        th,
        'sorted',
        this.sortedAscending ? 'asc' : 'desc'
      );
    } else {
      if (this.sortedOn) {
        this.columnHeaders[this.sortedOn].removeAttribute('data-sorted');
      }
      htmlUtil.setViewState(th, 'sorted', 'asc');
      this.sortedAscending = true;
      this.sortRows(column);
    }
    this.sortedOn = column;

    this.rowsEle.innerHTML = '';
    for (const row of this.sortedRows) {
      this.rowsEle.appendChild(this.allTrs[row.idx]);
    }
  }

  private reverseRows() {
    const a: SortedRow[] = [];
    for (let i = this.sortedRows!.length - 1; i >= 0; i--) {
      a.push(this.sortedRows![i]);
    }
    this.sortedRows = a;
  }

  private sortRows(column: string) {
    this.sortedRows = [];
    let idx = -1;
    for (const row of this.data!) {
      idx++;
      this.sortedRows.push({ idx, value: row[column] });
    }
    this.sortedRows.sort((a, b) => {
      if (a.value === b.value) {
        return 0;
      }
      if (a.value > b.value) {
        return 1;
      }
      return -1;
    });
  }
}
