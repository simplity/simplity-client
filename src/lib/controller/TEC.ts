import {
  AppController,
  Form,
  FormController,
  PageController,
  TableEditor,
  TableEditorController,
  TableEditorView,
  Values,
  Vo,
} from 'simplity-types';
import { loggerStub } from '../logger-stub/logger';
import { FC } from './formController';

const logger = loggerStub.getLogger();

/**
 * controls a tabular data (rows and columns)
 */
export class TEC implements TableEditorController {
  public readonly type = 'grid';
  public readonly name: string;
  public readonly ac: AppController;
  public readonly pc: PageController;
  /**
   * form on which this table is based. It is usually provided, but not mandatory.
   */
  public readonly form?: Form;
  /**
   * met-data of the table panel
   */
  private readonly table: TableEditor;
  /**
   * viw-component instance associated with this table (e.g. angular component)
   */
  private readonly view: TableEditorView;

  /**
   * data behind this view-component
   * this is THE MODEL that this controller is controlling
   * since the view is for readonly, the data is not modified
   * however, if selection is enables, this additional column is added to the data
   *
   */
  private data: Values[] = [];

  /**
   * data controllers, one per row, but only if this is an editable table
   */
  private controllers: FormController[] = [];

  /**
   * important to note that this constructor is called from the constructor of tableView.
   * TableView MAY NOPT be rendered fully. Hence instance of tableView should not be used to invoke any of its methods inside this constructor
   * @param fc form controller that manages this table
   * @param view
   */
  public constructor(
    public readonly fc: FormController,
    view: TableEditorView
  ) {
    this.name = view.name;
    this.pc = fc.pc;
    this.ac = this.pc.ac;
    this.view = view;

    this.table = view.table;
    const formName = this.table.formName;
    if (formName) {
      this.form = this.ac.getForm(formName);
    }
  }

  //todo: implement this
  isModified(): boolean {
    return false;
  }
  tableRendered(): void {
    //Good to know. We do not see any work as of now.
  }

  getFormName(): string | undefined {
    return this.form && this.form.name;
  }

  receiveData(data: Vo | Vo[]): void {
    if (Array.isArray(data)) {
      this.setData(data as Values[]);
      return;
    }
    logger.error(
      `${this.name} is a table controller but a non-array data is being set. Data ignored`
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
    this.view.reset();

    this.controllers = [];

    //add rows to the view
    let idx = 0;
    for (const row of data) {
      this.doAppend(idx, row);
      idx++;
    }
  }

  resetData(fields?: string[]): void {
    this.setData([]);
  }

  appendRow(values?: Values): number {
    const idx = this.controllers.length;
    this.doAppend(idx, values);
    return idx;
  }

  private doAppend(idx: number, row?: Values): void {
    const name = this.name + '_' + idx;
    const fc = new FC(name, this.pc, this.form, row);
    this.controllers.push(fc);

    this.view.appendRow(fc, idx, row);
    fc.formRendered();
  }

  public getData(): Values[] {
    /**
     * not all fields from the form may be rendered.
     * we need to include received data even if it is not rendered.
     * hence each row is a merged object of received+edited; (edited would override received data)
     */
    const rows: Values[] = [];
    for (const c of this.controllers) {
      rows.push(c.getData() as Values);
    }
    return rows;
  }

  public getColumnValues(names: string[], rowId: number): Values {
    const values: Values = {};
    const row = this.data[rowId];
    if (!row) {
      this.warn(rowId);
      return values;
    }

    let fieldsMissing = false;
    for (const name of names) {
      const value = row[name];
      if (value === undefined) {
        fieldsMissing = false;
      } else {
        values[name] = value;
      }
    }

    if (fieldsMissing) {
      const rowData = this.controllers[rowId].getData() as Values;
      for (const name of names) {
        const value = rowData[name];
        if (value !== undefined) {
          values[name] = value;
        }
      }
    }

    return values;
  }

  public setColumnValues(values: Values, rowId: number): void {
    const row = this.data[rowId];
    if (!row) {
      this.warn(rowId);
      return;
    }

    const fc = this.controllers[rowId];
    for (const [name, value] of Object.entries(values)) {
      row[name] = value;
      if (fc) {
        fc.setFieldValue(name, value);
      }
    }
  }

  public rowClicked(rowIdx: number): void {
    const idx = this.sanitizeIdx(rowIdx);
    if (idx === undefined) {
      return;
    }
  }

  private warn(rowId: number): void {
    logger.warn(
      `Table ${this.name} has ${this.data.length} rows, but a request was made for row ${rowId} (0 based)`
    );
  }

  public isValid(): boolean {
    return this.validate();
  }

  /**
   * validate all editable components again
   * @returns true is all editable components are valid. false otherwise
   */
  public validate(): boolean {
    let allOk = false;

    for (const dc of this.controllers) {
      const ok = dc.validate();
      if (!ok) {
        allOk = false;
      }
    }
    return allOk;
  }

  private sanitizeIdx(idx: number): number | undefined {
    if (idx >= 0 && idx < this.data.length) {
      return idx;
    }
    return undefined;
  }

  setDisplayState(_compName: string, _settings: Values): boolean {
    return false;
  }

  setColumnDisplayState(
    _columnName: string,
    _stateName: string,
    _stateValue: string | number | boolean
  ): void {
    throw new Error('Method not implemented.');
  }
  setCellDisplayState(
    _columnName: string,
    _stateName: string,
    _stateValue: string | number | boolean,
    _rowId?: number
  ): void {
    throw new Error('Method not implemented.');
  }
}
