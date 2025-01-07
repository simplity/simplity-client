import {
  BaseComponent,
  Button,
  DataField,
  FieldView,
  FilterParams,
  FormController,
  PageController,
  Panel,
  ReportServiceResponse,
  ReportSettings,
  ServiceRequestOptions,
  SimpleList,
  StringMap,
  TableEditor,
  TableEditorController,
  TableViewer,
  TableViewerController,
  Vo,
} from 'simplity-types';

import { loggerStub } from '../logger-stub/logger';
const logger = loggerStub.getLogger();
type FieldRow = { seqNo?: number; field: string; label: string };
const MAX_ROWS = 'maxRows';
const FILTERS = 'filters';
const FIELD_SEQUENCES = 'fieldSequences';
const SORTS = 'sorts';
const GO_BUTTON = 'goButton';
const VARIANT_NAME = 'reportVariant';
const REPORT_SERVICE_NAME = '_getReportSettings';
const COMPARATORS = [
  { value: '=', label: 'equal to' },
  { value: '!=', label: 'not equal to' },
  { value: '<', label: 'less than' },
  { value: '<=', label: 'less than or equal to' },
  { value: '>', label: 'greater than' },
  { value: '<', label: 'greater than or equal to' },
  { value: '~', label: 'contains' },
  { value: '^', label: 'starts with' },
  { value: '><', label: 'between' },
];

/**
 * this is the panel. For a given list, it requires 2 changes
 * 1. Report selector button may have to be added.
 * 2. fields named "field" (2 of them) require their listOptions to be set to the list of fields in this table
 *
 * To accommodate these:
 * 1. define the panel as a constant without the report selector.
 * 2. JSON.Stringify() into a constant.
 * 3. For each instance, JSON.parse() to create a clone of this panel.
 * 4. modify it as per the needs.
 *
 * NOTE: We considered "deep-copy" for cloning, but that requires additional code that is not really worth while
 */

export class ReportConfigurator {
  private readonly name: string;
  private allFieldNames: string[] = [];
  private fieldsList: SimpleList = [];
  /**
   * labels for all the fields
   */
  private labels: StringMap<string> = {};
  private readonly pc: PageController;
  private allSettings: StringMap<ReportSettings> = {};
  /**
   * Controller of field sequencing. The underlying data structure for this table is non-standard.
   * While the table as seqNo and name, and label as fields, the underlying data is an array of field names
   * Hence we need tp pre and posy process the underlying data
   */
  private fieldSeqController?: TableEditorController;

  constructor(
    /**
     * controller for this settings panel
     */
    private readonly fc: FormController,
    /**
     * table controller for this report
     */
    private readonly twc: TableViewerController,
    private readonly table: TableViewer
  ) {
    this.pc = this.twc.pc;
    this.name = table.name;

    this.setFieldsAndLabels();
    /**
     * we need to listen to onClick on the go button
     */
    this.fc.addEventListener(GO_BUTTON, 'click', () => {
      this.doFilter();
    });

    if (this.table.reportName) {
      /**
       * get the pre-defined settings for this report
       */
      this.pc.requestService(REPORT_SERVICE_NAME, {
        payload: { reportName: this.table.reportName! },
        toDisableUx: false,
        callback: (vo) => {
          this.settingsReceived(vo);
        },
      });

      /**
       * we need to change the settings as and when the user changes the report-variant
       */
      this.fc.addEventListener(VARIANT_NAME, 'change', (evt) => {
        console.info(evt);
        this.variantChanged(evt.newValue as string);
      });
    }
  }

  private settingsReceived(vo?: Vo): void {
    this.allSettings = {};

    if (!vo || !vo.list) {
      return;
    }
    const names: SimpleList = [];
    for (const { variantName, settings } of (vo as ReportServiceResponse)
      .list) {
      this.allSettings[variantName] = settings;
      names.push({ value: variantName, label: variantName });
    }

    const f = this.fc.getChild(VARIANT_NAME)! as FieldView;
    f.setList(names);
    /**
     * setList() would set the first value to the field as we have marked the field as mandatory.
     * that would in turn trigger this.variantChanged because we have registered that as a listener for that event
     */
  }

  /**
   * call report service with this report
   */
  private variantChanged(name: string): void {
    const settings = this.allSettings[name];
    if (!settings) {
      logger.error(
        `variant name is set to "${name}", but no settings found for this variant. Error in setting drop-downs?`
      );
      return;
    }
    /**
     * settings has the right Vo for our form, except that the "fields": string[] needs to be replaced fieldSequences: FieldRow[]
     */
    const vo: Vo = { ...settings };
    vo[FIELD_SEQUENCES] = this.toFieldRow(settings.fields);
    delete vo.fields;
    this.fc.setData(vo);
  }

  private setFieldsAndLabels(): void {
    this.fieldsList = [];
    this.allFieldNames = [];
    this.labels = {};

    if (this.table.columns) {
      for (const { name, label } of this.table.columns) {
        this.fieldsList.push({ value: name, label });
        this.allFieldNames.push(name);
        this.labels[name] = label;
      }
    } else if (this.table.children) {
      for (let { name, label } of this.table.children) {
        if (!label) {
          label = '';
        }
        this.fieldsList.push({ value: name, label });
        this.allFieldNames.push(name);
        this.labels[name] = label;
      }
    } else {
      console.error(
        'List configuration is not yet designed to handle dynamic columns'
      );
    }
  }

  public doFilter() {
    let maxRows = this.fc.getFieldValue(MAX_ROWS) as number;

    /**
     * There are three tables : FIELDS, FILTERS and SORTS
     */
    /**
     * Step 1: sort the fields based on seqNo and make an array of field names
     */
    let tec = this.fc.getController(FIELD_SEQUENCES)!;
    const fieldRows = tec.getData() as FieldRow[];
    arrangeFields(fieldRows);
    tec.setData(fieldRows);
    let fields: string[] | undefined = getNames(fieldRows);
    if (fields.length == 0) {
      fields = undefined;
    }
    this.twc.resetColumns(fields);

    /**
     * Step 2: we are yet to provide feature to delete a row.
     * as of now, we will just send it as-it-is
     */
    tec = this.fc.getController(FILTERS)!;
    const filters = tec.getData();

    /**
     * step 3: sorts also does not have delete-row feature
     */
    tec = this.fc.getController(SORTS)!;
    const sorts = tec.getData();

    /**
     * prepare the payload
     */
    const payload = { fields, filters, sorts } as FilterParams;
    if (maxRows) {
      payload[MAX_ROWS] = maxRows;
    }
    const serviceName = 'filter_' + this.table.reportName;
    const options: ServiceRequestOptions = {
      payload,
      targetPanelName: this.name,
    };
    this.pc.requestService(serviceName, options);
  }

  /**
   * to be invoked after the view-component renders the panel
   */
  public rendered() {
    this.fc.formRendered();
    this.fieldSeqController = this.fc.getController(
      FIELD_SEQUENCES
    ) as TableEditorController;
    /** set data to the fields selection table */
    this.fieldSeqController.setData(this.toFieldRow(this.allFieldNames));
  }

  private toFieldRow(names: string[]): FieldRow[] {
    const data: FieldRow[] = [];
    let seqNo = 10;
    const selectedOnes: StringMap<true> = {};

    // push the selected ones first
    for (const name of names) {
      data.push({ seqNo, field: name, label: this.labels[name] });
      selectedOnes[name] = true;
      seqNo += 10;
    }

    //now push the other column names
    for (const name of this.allFieldNames) {
      if (!selectedOnes[name]) {
        data.push({ seqNo: 0, field: name, label: this.labels[name] });
      }
    }

    return data;
  }
  /**
   * a panel component that is to be rendered as the Configuration Panel for this table
   * Returned panel uses naming conventions to ensure that a page can have multiple such panels
   * @returns
   */
  public getConfigPanel(): Panel {
    const panel = {
      name: 'listConfig',
      compType: 'panel',
      children: [
        {
          name: MAX_ROWS,
          compType: 'field',
          isRequired: false,
          renderAs: 'text-field',
          valueType: 'integer',
          label: 'Max Rows',
        } as DataField,
        /**
         * reportName selector is to be inserted, if required
         */
        {
          name: FIELD_SEQUENCES,
          compType: 'table',
          editable: true,
          label: 'Columns Selection',
          children: [
            {
              name: 'seqNo',
              label: 'Seq No',
              compType: 'field',
              isRequired: false,
              renderAs: 'text-field',
              valueType: 'integer',
            } as DataField,

            /**
             * field is what we need internally, while use render the label for the end-user
             */
            {
              name: 'label',
              label: 'Field',
              compType: 'field',
              isRequired: true,
              renderAs: 'output',
              valueType: 'text',
            } as DataField,
          ] as DataField[],
        } as TableEditor,
        {
          name: FILTERS,
          compType: 'table',
          editable: true,
          label: 'Filters',
          rowsCanBeAdded: true,
          children: [
            {
              name: 'field',
              label: 'Field',
              compType: 'field',
              isRequired: true,
              renderAs: 'select',
              /**
               *listOptions: [{}...] to be added here
               */
              valueType: 'text',
            } as DataField,
            {
              name: 'comparator',
              label: 'Comparator',
              compType: 'field',
              isRequired: true,
              renderAs: 'select',
              listOptions: COMPARATORS,
              valueType: 'text',
            },

            {
              name: 'value',
              label: 'Value',
              compType: 'field',
              isRequired: true,
              renderAs: 'text-field',
              valueSchema: 'text1000',
              valueType: 'text',
            },
            {
              name: 'toValue',
              label: 'To Value',
              compType: 'field',
              isRequired: false,
              renderAs: 'text-field',
              valueType: 'text',
            },
          ],
        } as TableEditor,
        {
          name: SORTS,
          compType: 'table',
          editable: true,
          label: 'Sort By',
          rowsCanBeAdded: true,
          children: [
            {
              name: 'field',
              label: 'Field',
              compType: 'field',
              isRequired: true,
              renderAs: 'select',
              listOptions: [{ label: 'label1', value: 'value1' }],
              /**
               *listOptions: [{}...] to be added here
               */
              valueType: 'text',
            } as DataField,

            {
              name: 'descending',
              label: 'Sort Descending?',
              compType: 'field',
              isRequired: true,
              renderAs: 'check-box',
              valueType: 'boolean',
            } as DataField,
          ] as BaseComponent[],
        } as TableEditor,

        {
          name: GO_BUTTON,
          compType: 'button',
          buttonType: 'primary',
          label: 'Get Data',
          onClick: '',
        } as Button,
      ] as BaseComponent[],
    }; /* as Panel */

    //add the listOptions to the two fields
    let field = (panel.children[2] as Panel).children[0] as DataField;
    field.listOptions = this.fieldsList;
    field = (panel.children[3] as Panel).children[0] as DataField;
    field.listOptions = this.fieldsList;
    if (this.table.reportName) {
      const variantField = {
        name: VARIANT_NAME,
        compType: 'field',
        valueType: 'text',
        isRequired: true,
        renderAs: 'select',
        label: 'Report',
      } as DataField;
      panel.children = [variantField, ...panel.children];
    }
    return panel as Panel;
  }
}

function arrangeFields(fields: FieldRow[]): void {
  fields.sort((a, b) => {
    const s1 = a.seqNo;
    const s2 = b.seqNo;
    /**
     * important to note that we want 0/undefined to come at the last.
     * That is 0/undefined is treated MAX_NUMBER
     * as per the spec we are to return 0 if they are equal.
     * but we treat later one as greater to retain the current order.
     */
    if (s1 && s2) {
      return s1 <= s2 ? -1 : 1;
    }
    //even if the t
    if (s2) {
      return 1;
    }
    return -1;
  });

  let seq = 10;
  for (const a of fields) {
    if (a.seqNo) {
      a.seqNo = seq;
      seq += 10;
    } else {
      a.seqNo = undefined;
    }
  }
}

/**
 * get an array of just the names of the fields.
 * Note that the fields array is already sorted with non-selected fields at the end
 * @param fields
 * @returns
 */
function getNames(fields: FieldRow[]): string[] {
  let names: string[] = [];
  for (const a of fields) {
    if (!a.seqNo) {
      break;
    }
    names.push(a.field);
  }
  return names;
}
