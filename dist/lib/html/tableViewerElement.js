"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableViewerElement = void 0;
const baseElement_1 = require("./baseElement");
const htmlUtil_1 = require("./htmlUtil");
const elementFactory_1 = require("./elementFactory");
const leafElement_1 = require("./leafElement");
const fieldElement_1 = require("./fieldElement");
class TableViewerElement extends baseElement_1.BaseElement {
    constructor(fc, table, maxWidth) {
        super(fc, table, 'table', maxWidth);
        this.fc = fc;
        this.table = table;
        this.allTrs = [];
        /**
         * populated if headerDetails is added. Else will remain empty
         */
        this.columnDetailsMap = {};
        this.lastSearched = '';
        this.searchData = [];
        this.hiddenRows = [];
        /**
         * thead elements mapped by column name
         */
        this.columnHeaders = {};
        this.sortedOn = ''; //column on which it this table is sorted
        this.sortedRows = [];
        this.sortedAscending = false;
        this.sortable = !!table.sortable;
        this.searchable = !!table.searchable;
        this.configurable = !!table.configurable;
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
        this.searchEle = htmlUtil_1.htmlUtil.getOptionalElement(this.root, 'search');
        this.configEle = htmlUtil_1.htmlUtil.getOptionalElement(this.root, 'list-config');
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
        if (this.table.onRowClick) {
            this.tableEle.setAttribute('data-clickable', '');
        }
        if (table.selectFieldName) {
            this.tableEle.setAttribute('data-selectable', '');
        }
        this.twc = this.fc.newTableViewerController(this);
        this.initSearch();
        this.initConfig();
        this.initHeaderDetails();
        if (this.columnDetails) {
            this.renderHeaders(this.columnDetails);
        }
    }
    /////////////////// methods to render rows
    initHeaderDetails() {
        //readily available on a platter?
        if (this.table.columns) {
            this.columnDetails = this.table.columns;
        }
        else if (this.table.children) {
            //infer from child components
            this.columnDetails = [];
            for (const child of this.table.children) {
                this.columnDetails.push({
                    name: child.name,
                    label: child.label || htmlUtil_1.htmlUtil.toLabel(child.name),
                    valueType: child.compType === 'field'
                        ? child.valueType
                        : 'text',
                    comp: child,
                });
            }
        }
        else if (this.table.formName) {
            //if form is given, we assume all the fields in the form
            this.columnDetails = [];
            const form = this.ac.getForm(this.table.formName);
            for (const name of form.fieldNames) {
                const field = form.fields[name];
                if (field.renderAs === 'hidden') {
                    continue;
                }
                this.columnDetails.push({
                    name,
                    label: field.label || htmlUtil_1.htmlUtil.toLabel(field.name),
                    valueType: field.valueType,
                });
            }
        }
        else {
            this.logger.info(`Table ${this.name} has no design-time columns. 
        Hence the header row is not rendered onload.
        columns will be rendered as and when data is received`);
            return;
        }
        /**
         * populate the map for look-up purpose for dynamic columns
         */
        for (const col of this.columnDetails) {
            this.columnDetailsMap[col.name] = col;
        }
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
                    this.addTdForComp(textValue, col.comp, rowEle, searchRow);
                    continue;
                }
                const isNumeric = col.valueType === 'integer' || col.valueType === 'decimal';
                const td = this.addTd(textValue, isNumeric, rowEle, searchRow);
                if (col.valueFormatterFn) {
                    const fn = this.ac.getFn(col.valueFormatterFn, 'format')
                        .fn;
                    const fd = fn(value, row);
                    if (fd.markups) {
                        for (const [name, attr] of Object.entries(fd.markups)) {
                            td.setAttribute('data-' + name, attr);
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
        htmlUtil_1.htmlUtil.appendText(td, value);
        if (isNumeric) {
            td.setAttribute('data-align', 'right');
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
        if (leafComp.compType === 'field') {
            ele = new fieldElement_1.FieldElement(undefined, leafComp, 0);
        }
        else {
            ele = new leafElement_1.LeafElement(undefined, leafComp, 0);
        }
        td.appendChild(ele.root);
        rowEle.appendChild(td);
        if (value) {
            searchRow.push(value.toLowerCase());
        }
    }
    formatColumnValue(value, vrd, row) {
        if (vrd.valueFormatterFn) {
            const fn = this.ac.getFn(vrd.valueFormatterFn, 'format')
                .fn;
            const fd = fn(value, row);
            return fd.value;
        }
        if (vrd.valueFormatter) {
            return htmlUtil_1.htmlUtil.formatValue(value, vrd.valueFormatter);
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
        ele.setAttribute('data-idx', idx.toString());
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
            ele.setAttribute('data-align', 'right');
        }
        if (this.sortable) {
            ele.setAttribute('data-sortable', '');
            ele.addEventListener('click', () => {
                this.sort(name);
            });
        }
        htmlUtil_1.htmlUtil.appendText(ele, label);
        this.headerRowEle.appendChild(ele);
        return ele;
    }
    /**
     * we assume that all the rows have the same set of fields/columns
     * @param data
     */
    getDynamicHeader(data, names) {
        let allCols = this.columnDetails;
        if (!allCols) {
            allCols = [];
            for (const [name, value] of Object.entries(data[0])) {
                allCols.push({
                    name,
                    valueType: typeof value === 'number' ? 'integer' : 'text',
                    label: htmlUtil_1.htmlUtil.toLabel(name),
                });
            }
        }
        if (!names) {
            return allCols;
        }
        const cols = [];
        for (const name of names) {
            cols.push(this.columnDetailsMap[name]);
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
        const configEle = elementFactory_1.elementFactory.newElement(fc, panel, this.maxWidth);
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
            th.setAttribute('data-sorted', this.sortedAscending ? 'asc' : 'desc');
        }
        else {
            if (this.sortedOn) {
                this.columnHeaders[this.sortedOn].removeAttribute('data-sorted');
            }
            th.setAttribute('data-sorted', 'asc');
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
exports.TableViewerElement = TableViewerElement;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGVWaWV3ZXJFbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9odG1sL3RhYmxlVmlld2VyRWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFlQSwrQ0FBNEM7QUFDNUMseUNBQXNDO0FBQ3RDLHFEQUFrRDtBQUNsRCwrQ0FBNEM7QUFDNUMsaURBQThDO0FBSTlDLE1BQWEsa0JBQW1CLFNBQVEseUJBQVc7SUFvRGpELFlBQ2tCLEVBQWtCLEVBQ2xCLEtBQWtCLEVBQ2xDLFFBQWlCO1FBRWpCLEtBQUssQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztRQUpwQixPQUFFLEdBQUYsRUFBRSxDQUFnQjtRQUNsQixVQUFLLEdBQUwsS0FBSyxDQUFhO1FBMUM1QixXQUFNLEdBQWtCLEVBQUUsQ0FBQztRQU9uQzs7V0FFRztRQUNjLHFCQUFnQixHQUE2QixFQUFFLENBQUM7UUFjekQsaUJBQVksR0FBRyxFQUFFLENBQUM7UUFDVCxlQUFVLEdBQWEsRUFBRSxDQUFDO1FBQzFCLGVBQVUsR0FBYyxFQUFFLENBQUM7UUFNNUM7O1dBRUc7UUFDSyxrQkFBYSxHQUEyQixFQUFFLENBQUM7UUFDM0MsYUFBUSxHQUFHLEVBQUUsQ0FBQyxDQUFDLHlDQUF5QztRQUN4RCxlQUFVLEdBQWdCLEVBQUUsQ0FBQztRQUM3QixvQkFBZSxHQUFHLEtBQUssQ0FBQztRQVM5QixJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDO1FBQ2pDLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUM7UUFDckMsSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQztRQUV6Qzs7V0FFRztRQUNILElBQUksQ0FBQyxRQUFRLEdBQUcsbUJBQVEsQ0FBQyxlQUFlLENBQUMsSUFB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