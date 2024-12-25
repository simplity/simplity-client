"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableViewerElement = void 0;
const baseElement_1 = require("./baseElement");
const htmlUtil_1 = require("./htmlUtil");
const elementFactory_1 = require("./elementFactory");
class TableViewerElement extends baseElement_1.BaseElement {
    constructor(fc, table) {
        super(fc, table, 'table');
        this.fc = fc;
        this.table = table;
        this.allTrs = [];
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
    }
    /////////////////// methods to render rows
    showData(data) {
        this.reset();
        this.data = data;
        const fields = this.renderDynamicHeaders(data);
        let idx = -1;
        for (const row of data) {
            idx++;
            /**
             * search row has  all the column values joined in it as a string
             */
            const searchRow = [];
            const rowEle = this.addTr(idx);
            for (const [name, isNumeric] of Object.entries(fields)) {
                let value = row[name];
                if (value === undefined) {
                    value = '';
                }
                else {
                    value = '' + value;
                }
                this.addTd(value, isNumeric, rowEle, searchRow);
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
    renderData(data, columns) {
        this.data = data;
        this.reset();
        this.renderHeaderForColumns(columns);
        let idx = -1;
        for (const row of data) {
            idx++;
            /**
             * search row has  all the column values joined in it as a string
             */
            const searchRow = [];
            const rowEle = this.addTr(idx);
            for (const col of columns) {
                const value = row[col.name];
                const textValue = this.formatColumnValue(value, col, row);
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
            this.rowsEle.appendChild(rowEle);
            this.searchData.push(searchRow.join('\n'));
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
    renderChildren(data, columns) {
        this.data = data;
        this.reset();
        this.renderHeaderForChildren(columns);
        this.searchData.length = 0;
        let idx = -1;
        for (const row of data) {
            idx++;
            /**
             * search row has  all the column values joined in it as a string
             */
            const searchRow = [];
            const rowEle = this.addTr(idx);
            for (const column of columns) {
                const value = row[column.name];
                const cellEle = this.dataCellEle.cloneNode(true);
                const field = elementFactory_1.elementFactory.newElement(undefined, column, value, true);
                cellEle.appendChild(field.root);
                rowEle.appendChild(cellEle);
                if (value !== undefined && value !== '') {
                    searchRow.push(value.toString());
                }
            }
            this.searchData.push(searchRow.join('\n'));
            this.rowsEle.appendChild(rowEle);
        }
    }
    /**
     * remove all rows that are rendered. Remove the header as well
     */
    reset() {
        this.rowsEle.innerHTML = '';
        this.headerRowEle.innerHTML = '';
        this.allTrs = [];
        this.sortedRows = [];
        this.columnHeaders = {};
        this.searchData.length = 0;
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
    renderHeaderForChildren(children) {
        for (const node of children) {
            let isNumeric = false;
            if (node.compType === 'field') {
                const vt = node.valueType;
                if (vt === 'decimal' || vt === 'integer') {
                    isNumeric = true;
                }
            }
            this.addTh(node.name, isNumeric, node.label || '');
        }
    }
    /**
     * we assume that all the rows have the same set of fields/columns
     * @param data
     */
    renderDynamicHeaders(data) {
        const fields = {};
        for (const [name, value] of Object.entries(data[0])) {
            const isNumeric = typeof value === 'number';
            this.addTh(name, isNumeric, htmlUtil_1.htmlUtil.toLabel(name));
            fields[name] = isNumeric;
        }
        return fields;
    }
    renderHeaderForColumns(cols) {
        for (const col of cols) {
            const isNumeric = col.valueType === 'integer' || col.valueType === 'decimal';
            const ele = this.addTh(col.name, isNumeric, col.label || '');
            if (col.labelAttributes) {
                for (const [attr, value] of Object.entries(col.labelAttributes)) {
                    ele.setAttribute('data-' + attr, value);
                }
            }
        }
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
        const configEle = elementFactory_1.elementFactory.newElement(fc, panel);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGVWaWV3ZXJFbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9odG1sL3RhYmxlVmlld2VyRWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFjQSwrQ0FBNEM7QUFDNUMseUNBQXNDO0FBQ3RDLHFEQUFrRDtBQUlsRCxNQUFhLGtCQUFtQixTQUFRLHlCQUFXO0lBMENqRCxZQUNrQixFQUFrQixFQUNsQixLQUFrQjtRQUVsQyxLQUFLLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztRQUhWLE9BQUUsR0FBRixFQUFFLENBQWdCO1FBQ2xCLFVBQUssR0FBTCxLQUFLLENBQWE7UUFoQzVCLFdBQU0sR0FBa0IsRUFBRSxDQUFDO1FBYzNCLGlCQUFZLEdBQUcsRUFBRSxDQUFDO1FBQ1QsZUFBVSxHQUFhLEVBQUUsQ0FBQztRQUMxQixlQUFVLEdBQWMsRUFBRSxDQUFDO1FBTTVDOztXQUVHO1FBQ0ssa0JBQWEsR0FBMkIsRUFBRSxDQUFDO1FBQzNDLGFBQVEsR0FBRyxFQUFFLENBQUMsQ0FBQyx5Q0FBeUM7UUFDeEQsZUFBVSxHQUFnQixFQUFFLENBQUM7UUFDN0Isb0JBQWUsR0FBRyxLQUFLLENBQUM7UUFROUIsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQztRQUNqQyxJQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDO1FBQ3JDLElBQUksQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUM7UUFFekM7O1dBRUc7UUFDSCxJQUFJLENBQUMsUUFBUSxHQUFHLG1CQUFRLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFFN0Q7O1dBRUc7UUFDSCxJQUFJLENBQUMsWUFBWSxHQUFHLG1CQUFRLENBQUMsZUFBZSxDQUFD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