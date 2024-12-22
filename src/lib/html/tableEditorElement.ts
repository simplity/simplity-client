import {
  TableEditor,
  TableEditorView,
  Values,
  TableEditorController,
  FormController,
} from 'simplity-types';
import { BaseElement } from './baseElement';
import { htmlUtil } from './htmlUtil';
import { elementFactory } from './elementFactory';

export class TableEditorElement extends BaseElement implements TableEditorView {
  private tec: TableEditorController;
  private tableEle: HTMLElement;
  private rowsEle: HTMLElement;
  private headerRowEle: HTMLElement;
  private dataRowEle: HTMLElement;
  private headerCellEle: HTMLElement;
  private dataCellEle: HTMLElement;
  //private configEle: HTMLElement | undefined;
  //private currentConfig: ListConfiguration | undefined;
  //private Configs: ListConfiguration[] | undefined;

  constructor(
    public readonly fc: FormController,
    public readonly comp: TableEditor
  ) {
    super(fc, comp, 'grid');

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
    const btn = htmlUtil.getChildElement(this.root, 'add-button');
    if (comp.rowsCanBeAdded) {
      btn.addEventListener('click', () => {
        console.info(`add row clicked for ${this.comp.name}`);
        this.tec.appendRow();
      });
    } else {
      btn.remove();
    }

    /**
     * we expect the header row to have just one cell. We use that for cloning
     */
    this.headerCellEle = this.headerRowEle.children[0] as HTMLElement;
    this.headerCellEle.remove();

    /**
     * we expect only one cell in the only row. We use both the row and the cell for cloning
     */
    this.dataCellEle = this.dataRowEle.children[0] as HTMLElement;
    this.dataCellEle.remove();
    this.dataRowEle.remove();
    this.renderHeader();

    this.tec = this.fc.newTableEditorController(this);

    this.tableEle;
  }

  /**
   * remove all rows that are rendered
   */
  public reset() {
    htmlUtil.removeChildren(this.rowsEle);
  }

  /**
   * render an additional row, possibly with data.
   * for list(read-only) it's always with data.
   * for a grid, this could be an empty row to add data for a new row
   * @param fc form controller that manages this row
   * @param rowIdx 0-based index of this row in the data-array.
   * the row in the view is marked with this index
   * @param values optional values to set to the view-components
   */
  public appendRow(fc: FormController, rowIdx: number, values?: Values) {
    const rowEle = this.dataRowEle.cloneNode(true) as HTMLElement;
    rowEle.setAttribute('data-idx', rowIdx.toString());

    for (const column of this.comp.children) {
      const cellEle = this.dataCellEle.cloneNode(true) as HTMLElement;
      let value = values && values[column.name];
      if (this.comp.editable) {
        const field = elementFactory.newElement(fc, column, value, true);
        cellEle.appendChild(field.root);
      } else {
        if (value === undefined) {
          value = '';
        } else {
          value = '' + value;
        }
        htmlUtil.appendText(cellEle, value);
      }
      rowEle.appendChild(cellEle);
    }
    this.rowsEle.appendChild(rowEle);
  }

  private renderHeader() {
    for (const column of this.comp.children) {
      const ele = this.headerCellEle.cloneNode(true) as HTMLElement;
      htmlUtil.appendText(ele, column.label || '');
      this.headerRowEle.appendChild(ele);
    }
  }
}
