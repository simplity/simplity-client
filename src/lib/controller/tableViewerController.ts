import { loggerStub } from '../logger-stub/logger';
import {
  AppController,
  Form,
  PageController,
  TableViewer,
  TableViewerView,
  Values,
  Vo,
  TableViewerController,
  Panel,
  FormController,
} from 'simplity-types';
import { ReportConfigurator } from './reportConfigurator';
import { FC } from './formController';

const logger = loggerStub.getLogger();

/**
 * controls a tabular data (rows and columns)
 */
export class TWC implements TableViewerController {
  public readonly type = 'table';
  public readonly name: string;
  public readonly ac: AppController;
  public readonly pc: PageController;
  /**
   * met-data of the table panel
   */
  private readonly table: TableViewer;
  /**
   * viw-component instance associated with this table (e.g. angular component)
   */
  private readonly view: TableViewerView;
  /**
   * form on which this table is based. It is usually provided, but not mandatory.
   */
  public readonly form?: Form;
  /**
   * additional information about this table, some of which may change during user interaction.
   * designed to be shared with the view-component for ease of rendering
   */
  private readonly info: TableInfo;

  /**
   * data behind this view-component
   * this is THE MODEL that this controller is controlling
   * since the view is for readonly, the data is not modified
   * however, if selection is enables, this additional column is added to the data
   *
   */
  private data: Values[] = [];

  /**
   * list config instance if it is rendered for this table
   */
  private reportConfigurator?: ReportConfigurator;

  /**
   * selected columns, if user has chosen a subset of columns
   */
  private selectedNames?: string[];

  private currentIdx: number = -1;
  /**
   * important to note that this constructor is called from the constructor of tableView.
   * TableView MAY NOT be rendered fully. Hence instance of tableView should not be used to invoke any of its methods inside this constructor
   * @param fc form controller that manages this table
   * @param view
   */
  public constructor(
    public readonly fc: FormController,
    view: TableViewerView
  ) {
    this.name = view.name;
    this.pc = fc.pc;
    this.ac = this.pc.ac;
    this.view = view;

    this.table = view.table as TableViewer;
    const formName = this.table.formName;
    if (formName) {
      this.form = this.ac.getForm(formName);
    }
    this.info = new TableInfo(this.table);
  }

  getRowData(rowIdx?: number): Vo | undefined {
    if (rowIdx === undefined) {
      rowIdx = this.currentIdx === -1 ? 0 : this.currentIdx;
    }
    return this.data[rowIdx];
  }

  public getFormName() {
    if (this.form) {
      return this.form.name;
    }
    return undefined;
  }

  createConfig(): { panel: Panel; fc: FormController } {
    let form: Form | undefined;
    let panel = this.table.configurationPanel;
    if (panel && panel.childFormName) {
      form = this.ac.getForm(panel.childFormName);
    }

    const fc = new FC(this.name + 'Config', this.pc, form);
    if (!panel) {
      this.reportConfigurator = new ReportConfigurator(fc, this, this.table);
      panel = this.reportConfigurator.getConfigPanel();
    }

    return { panel, fc };
  }

  configRendered(): void {
    this.reportConfigurator!.rendered();
  }

  resetColumns(names?: string[]): void {
    if (names && names.length > 0) {
      this.selectedNames = names;
    } else {
      this.selectedNames = undefined;
    }
  }

  quickSearch(text: string): void {
    logger.info(`Quick search initiated for text=${text}`);
  }

  receiveData(data: Vo | Vo[]): void {
    if (Array.isArray(data)) {
      this.setData(data as Values[]);
      return;
    }
    logger.error(
      `${this.name} is a table-controller but a non-array data is being set. Data ignored`
    );
  }
  public setData(data: Values[]): void {
    if (data === undefined) {
      data = [];
    } else if (Array.isArray(data) === false) {
      logger.error(`non-array data received for table ${this.name}`);
      data = [];
    }
    this.data = data;
    this.info.reset(data);

    this.view.renderData(data, this.selectedNames);
  }

  public getData(): Values[] {
    return this.data;
  }

  public rowClicked(rowIdx: number): void {
    const idx = this.sanitizeIdx(rowIdx);
    if (idx === undefined) {
      return;
    }
    this.currentIdx = idx;

    this.info.currentRowIdx = idx;
    if (this.table.onRowClick) {
      console.info(
        `row ${idx} clicked. Going to act on ${this.table.onRowClick}`
      );
      this.pc.act(this.table.onRowClick, undefined, this.data[idx]);
    }
  }

  public isValid(): boolean {
    return this.validate();
  }

  public validate(): boolean {
    if (!this.info.selectColumn) {
      return true;
    }

    if (this.info.nbrSelected < this.info.minRows) {
      // todo: flash error message
      logger.error(
        `At least  ${this.info.minRows} row/s to be selected. You have selected ${this.info.nbrSelected} row/s`
      );
      return false;
    }

    if (this.info.maxRows && this.info.nbrSelected > this.info.maxRows) {
      // todo: flash error message
      logger.error(
        `At most  ${this.info.maxRows} row/s to be selected. You have selected ${this.info.nbrSelected} row/s`
      );
      return false;
    }

    return true;
  }

  private sanitizeIdx(idx: number): number | undefined {
    if (idx >= 0 && idx < this.data.length) {
      return idx;
    }
    return undefined;
  }

  public selectARow(toSelect: boolean): TableInfo {
    const idx = this.info.currentRowIdx;
    if (this.info.selectColumn) {
      this.data[idx][this.info.selectColumn] = toSelect;
    }
    this.info.rowSelectionChanged(idx, toSelect);
    return this.info;
  }

  public selectAllRows(toSelect: boolean): TableInfo {
    for (const row of this.data) {
      row[this.table.selectFieldName!] = toSelect;
    }

    this.info.selectAllChanged(toSelect);
    return this.info;
  }

  public columnClicked(row: Vo, action: string): void {
    this.pc.act(action, undefined, row);
  }

  public setCurrentRowIdx(rowIdx: number): void {
    const idx = this.sanitizeIdx(rowIdx);
    if (idx !== undefined) {
      this.info.currentRowIdx = rowIdx;
    }
  }
}

export class TableInfo {
  /**
   * column names that are to be rendered.
   * first column could be the check-bax for selecting the row
   */
  columnNames: string[] = [];
  /**
   * labels for the columns to be rendered.
   */
  columnLabels: string[] = [];
  /**
   * row is clickable if selection is allowed ii onRowCLick action is set
   */
  rowIsClickable = false;
  /**
   * name of the column mapped to selection status of a row.
   * relevant only if this table is used for selecting rows
   */
  selectColumn?: string;

  /**
   * minimum number of rows to be selected. 0 if no such restrictions
   */
  minRows = 0;

  /**
   * maximum rows to be selected. 0 when no such restriction exists
   */
  maxRows = 0;
  /**
   * total number of rows in this table
   */
  totalRows = 0;
  /**
   * may be used by the view-component to show this.
   */
  nbrSelected = 0;
  /**
   * could be used by the view-component to highlight it
   */
  currentRowIdx = 0;
  /**
   * true there is at least one row in the table, and all rows are selected.
   * false if table has no rows or at least one row not selected
   */
  allSelected = false;
  /**
   * true if at least one row is selected AND at least one is not selected.
   * false if there are no rows, or all rows are selected, or no rows are selected
   */
  someSelected = false;
  /**
   * whether the row is selected or not
   */
  rowSelections: boolean[] = [];

  public constructor(meta: TableViewer) {
    this.minRows = meta.minRows || 0;
    this.maxRows = meta.maxRows || 9999;
    if (meta.selectFieldName) {
      if (meta.onRowClick) {
        throw new Error(
          `Panel ${meta.name} has both onRowClick and selectColumnName.`
        );
      }
      this.columnNames.push('_select_');
      this.columnLabels.push('');
    } else if (meta.onRowClick) {
      this.rowIsClickable = true;
    }

    this.selectColumn = meta.selectFieldName || undefined;
    if (meta.children) {
      for (const col of meta.children) {
        this.columnNames.push(col.name);
        const c: any = col;
        //  no header label for buttons
        const label = col.compType === 'field' ? c.label || col.name : '';
        this.columnLabels.push(label);
      }
    }
  }

  public rowSelectionChanged(idx: number, selected: boolean) {
    //TODO:
    return;

    if (this.rowSelections[idx] === selected) {
      return;
    }

    this.rowSelections[idx] = selected;
    if (selected) {
      this.nbrSelected++;
      this.someSelected = true;
      if (this.nbrSelected === this.totalRows) {
        this.allSelected = true;
        this.someSelected = false;
      }
    } else {
      this.nbrSelected--;
      this.allSelected = false;
      this.someSelected = this.nbrSelected !== 0;
    }
  }

  public selectAllChanged(selected: boolean): void {
    //TODO:
    return;
    if (selected) {
      this.nbrSelected = this.totalRows;
      this.allSelected = true;
    } else {
      this.nbrSelected = 0;
      this.allSelected = false;
    }
    this.someSelected = false;
    for (let i = 0; i < this.rowSelections.length; i++) {
      this.rowSelections[i] = selected;
    }
  }

  //not part of the interface. USed  by the controller
  public reset(data: Vo[]) {
    //TODO:
    return;
    this.totalRows = data.length;
    this.rowSelections = [];
    this.nbrSelected = 0;
    for (const row of data) {
      if (row[this.selectColumn || '']) {
        this.nbrSelected++;
        this.rowSelections.push(true);
      } else {
        this.rowSelections.push(false);
      }
    }

    if (this.nbrSelected === this.totalRows) {
      this.allSelected = true;
      this.someSelected = false;
    } else {
      this.allSelected = false;
      this.someSelected = this.nbrSelected > 0;
    }
    this.currentRowIdx = 0;
  }
}
