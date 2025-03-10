import { BaseElement } from './baseElement';
import { htmlUtil } from './htmlUtil';
import { elementFactory } from './elementFactory';
import { LeafElement } from './leafElement';
import { FieldElement } from './fieldElement';
export class TableViewerElement extends BaseElement {
    fc;
    table;
    twc;
    /**
     * components of this panel
     */
    tableEle;
    configEle;
    rowsEle;
    headerRowEle;
    dataRowEle;
    headerCellEle;
    dataCellEle;
    allTrs = [];
    /**
     * how to render the column headers and column Values?
     */
    columnDetails;
    /**
     * populated if headerDetails is added. Else will remain empty
     */
    columnDetailsMap = {};
    /**
     * what features are enabled?
     */
    searchable;
    sortable;
    configurable;
    /**
     * for implementing search feature
     */
    searchEle;
    searchInputEle;
    lastSearched = '';
    searchData = [];
    hiddenRows = [];
    /**
     * for implementing sort feature
     */
    data;
    /**
     * thead elements mapped by column name
     */
    columnHeaders = {};
    sortedOn = ''; //column on which  this table is sorted
    sortedRows = [];
    sortedAscending = false;
    constructor(fc, table, maxWidth) {
        super(fc, table, 'table', maxWidth);
        this.fc = fc;
        this.table = table;
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
        this.rowsEle = htmlUtil.getChildElement(this.root, 'rows');
        /**
         * typically <tbody> -> <tr>
         */
        this.dataRowEle = htmlUtil.getChildElement(this.root, 'row');
        this.searchEle = htmlUtil.getOptionalElement(this.root, 'search');
        this.configEle = htmlUtil.getOptionalElement(this.root, 'list-config');
        /**
         * we expect the header row to have just one cell. We use that for cloning
         */
        let ele = this.headerRowEle.children[0];
        ele.remove();
        if (table.sortable) {
            ele = htmlUtil.newHtmlElement('sortable-header');
        }
        this.headerCellEle = ele;
        /**
         * we expect only one cell in the only row. We use both the row and the cell for cloning
         */
        this.dataCellEle = this.dataRowEle.children[0];
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
    createHeaderDetails() {
        //readily available on a platter?
        if (this.table.columns) {
            return this.table.columns;
        }
        const details = [];
        if (this.table.children) {
            //infer from child components
            for (const child of this.table.children) {
                let field = child.compType === 'field' || child.compType === 'referred'
                    ? child
                    : undefined;
                if (field && field.hideInList) {
                    continue;
                }
                const hd = {
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
                }
                else {
                    hd.comp = child;
                }
                details.push(hd);
            }
            return details;
        }
        if (this.table.formName) {
            //if form is given, we assume all the fields in the form
            const form = this.ac.getForm(this.table.formName);
            for (const name of form.fieldNames) {
                const field = form.fields[name];
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
        this.logger.info(`Table ${this.name} has no design-time columns. 
        Hence the header row is not rendered onload.
        columns will be rendered as and when data is received`);
        return undefined;
    }
    renderHeaders(cols) {
        for (const col of cols) {
            const isNumeric = col.valueType === 'integer' || col.valueType === 'decimal';
            this.addTh(col.name, isNumeric, col.label);
        }
    }
    /**
     *
     * @param data
     * @param columnNames is specified, we are to render these columns, in that order
     */
    renderData(data, columnNames) {
        this.data = data;
        /**
         * header has to be re-rendered if it is not specified at design-time or we are to render a subset of the columns
         */
        const reRenderHeader = columnNames !== undefined || this.columnDetails === undefined;
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
    renderRows(data, cols) {
        let idx = -1;
        for (const row of data) {
            idx++;
            /**
             * search row has  all the column values joined in it as a string
             */
            const searchRow = [];
            const rowEle = this.addTr(idx);
            for (const col of cols) {
                const value = row[col.name];
                const textValue = this.formatColumnValue(value, col, row);
                if (col.comp) {
                    //comp is a static element.
                    this.addTdForComp(textValue, col.comp, rowEle, searchRow);
                    continue;
                }
                const isNumeric = col.valueType === 'integer' || col.valueType === 'decimal';
                const td = this.addTd(textValue, isNumeric, rowEle, searchRow);
                if (col.onClick) {
                    htmlUtil.setViewState(td, 'clickable', true);
                    td.addEventListener('click', () => {
                        this.twc.cellClicked(idx, col.onClick);
                    });
                }
                if (col.formattingFn) {
                    const fn = this.ac.getFn(col.formattingFn, 'format')
                        .fn;
                    const fd = fn(value, row);
                    if (fd.markups) {
                        for (const [name, attr] of Object.entries(fd.markups)) {
                            htmlUtil.setViewState(td, name, attr);
                        }
                    }
                }
            }
            this.searchData.push(searchRow.join('\n'));
            this.rowsEle.appendChild(rowEle);
        }
    }
    addTd(value, isNumeric, rowEle, searchRow) {
        const td = this.dataCellEle.cloneNode(true);
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
    addTdForComp(value, leafComp, rowEle, searchRow) {
        const td = this.dataCellEle.cloneNode(true);
        let ele;
        if (leafComp.compType === 'field' || leafComp.compType === 'referred') {
            //fields have to be rendered as output
            const df = { ...leafComp };
            df.renderAs = 'output';
            ele = new FieldElement(undefined, df, 0);
        }
        else {
            ele = new LeafElement(undefined, leafComp, 0);
        }
        td.appendChild(ele.root);
        rowEle.appendChild(td);
        if (value) {
            searchRow.push(value.toLowerCase());
        }
    }
    formatColumnValue(value, vrd, row) {
        if (vrd.formattingFn) {
            const fn = this.ac.getFn(vrd.formattingFn, 'format')
                .fn;
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
    reset(headerAsWell) {
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
    addTr(idx) {
        const ele = this.dataRowEle.cloneNode(true);
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
    addTh(name, isNumeric, label) {
        const ele = this.headerCellEle.cloneNode(true);
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
    getDynamicHeader(data, names) {
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
        const cols = [];
        for (const name of names) {
            const d = this.columnDetailsMap[name];
            if (d) {
                cols.push(d);
            }
            else {
                this.logger
                    .error(`Column '${name}' is requested at run time, but that is not a valid field/child/column as per design time parameters.
          Column is not rendered`);
            }
        }
        return cols;
    }
    initConfig() {
        if (!this.configEle) {
            if (this.configurable) {
                this.logger.error('HTML template for table-view does not have a container with data-id="list-config" but the table is marked for dynamic configuration');
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
    initSearch() {
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
        let input;
        const tagName = this.searchEle.tagName.toUpperCase();
        if (tagName === 'INPUT') {
            input = this.searchEle;
        }
        else {
            input = this.searchEle.querySelector('input');
            if (!input) {
                this.logger.error(`html template for table-viewer has no input element in its search element`);
                this.searchable = false;
                return;
            }
        }
        this.searchInputEle = input;
        input.addEventListener('input', () => {
            this.search();
        });
    }
    /**
     *
     * @returns
     */
    search() {
        if (!this.searchData || !this.searchData.length) {
            return;
        }
        const text = this.searchInputEle.value;
        if (text === this.lastSearched) {
            return;
        }
        if (!text) {
            this.resetSearch();
        }
        else if (this.lastSearched && text.startsWith(this.lastSearched)) {
            this.searchFurther(text);
        }
        else {
            this.freshSearch(text);
        }
        this.lastSearched = text;
    }
    resetSearch() {
        for (let ele = this.rowsEle.firstChild; ele; ele = ele.nextSibling) {
            ele.style.display = '';
        }
        this.hiddenRows.length = 0;
        this.searchInputEle.value = '';
    }
    freshSearch(text) {
        text = text.trim().toLowerCase();
        let idx = -1;
        for (let ele = this.rowsEle.firstChild; ele; ele = ele.nextSibling) {
            idx++;
            const isShown = !this.hiddenRows[idx];
            const toShow = this.searchData[idx].includes(text);
            if (toShow !== isShown) {
                if (toShow) {
                    ele.style.display = '';
                    this.hiddenRows[idx] = false;
                }
                else {
                    ele.style.display = 'none';
                    this.hiddenRows[idx] = true;
                }
            }
        }
    }
    searchFurther(text) {
        let idx = -1;
        for (let ele = this.rowsEle.firstChild; ele; ele = ele.nextSibling) {
            idx++;
            if (!this.hiddenRows[idx]) {
                if (!this.searchData[idx].includes(text)) {
                    ele.style.display = 'none';
                    this.hiddenRows[idx] = true;
                }
            }
        }
    }
    /////////// methods for sort feature
    sort(column) {
        if (!this.data || !this.data.length) {
            return;
        }
        const th = this.columnHeaders[column];
        if (!th) {
            this.logger.error(`This table has no column named ${column}. sort command ignored`);
            return;
        }
        if (this.sortedOn === column) {
            this.reverseRows();
            this.sortedAscending = !this.sortedAscending;
            htmlUtil.setViewState(th, 'sorted', this.sortedAscending ? 'asc' : 'desc');
        }
        else {
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
    reverseRows() {
        const a = [];
        for (let i = this.sortedRows.length - 1; i >= 0; i--) {
            a.push(this.sortedRows[i]);
        }
        this.sortedRows = a;
    }
    sortRows(column) {
        this.sortedRows = [];
        let idx = -1;
        for (const row of this.data) {
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
//# sourceMappingURL=tableViewerElement.js.map