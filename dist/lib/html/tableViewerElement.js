"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableViewerElement = void 0;
const baseElement_1 = require("./baseElement");
const htmlUtil_1 = require("./htmlUtil");
const elementFactory_1 = require("./elementFactory");
class TableViewerElement extends baseElement_1.BaseElement {
    constructor(fc, table, maxWidth) {
        super(fc, table, 'table', maxWidth);
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
                const field = elementFactory_1.elementFactory.newElement(undefined, column, 0, value);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGVWaWV3ZXJFbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9odG1sL3RhYmxlVmlld2VyRWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFlQSwrQ0FBNEM7QUFDNUMseUNBQXNDO0FBQ3RDLHFEQUFrRDtBQUlsRCxNQUFhLGtCQUFtQixTQUFRLHlCQUFXO0lBMENqRCxZQUNrQixFQUFrQixFQUNsQixLQUFrQixFQUNsQyxRQUFpQjtRQUVqQixLQUFLLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFKcEIsT0FBRSxHQUFGLEVBQUUsQ0FBZ0I7UUFDbEIsVUFBSyxHQUFMLEtBQUssQ0FBYTtRQWhDNUIsV0FBTSxHQUFrQixFQUFFLENBQUM7UUFjM0IsaUJBQVksR0FBRyxFQUFFLENBQUM7UUFDVCxlQUFVLEdBQWEsRUFBRSxDQUFDO1FBQzFCLGVBQVUsR0FBYyxFQUFFLENBQUM7UUFNNUM7O1dBRUc7UUFDSyxrQkFBYSxHQUEyQixFQUFFLENBQUM7UUFDM0MsYUFBUSxHQUFHLEVBQUUsQ0FBQyxDQUFDLHlDQUF5QztRQUN4RCxlQUFVLEdBQWdCLEVBQUUsQ0FBQztRQUM3QixvQkFBZSxHQUFHLEtBQUssQ0FBQztRQVM5QixJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDO1FBQ2pDLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUM7UUFDckMsSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQztRQUV6Qzs7V0FFRztRQUNILElBQUksQ0FBQyxRQUFRLEdBQUcsbUJBQVEsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUU3RDs7V0FFRztRQUNILElBQUksQ0FBQyxZQUFZLEdB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