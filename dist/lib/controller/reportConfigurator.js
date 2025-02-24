import { loggerStub } from '../logger-stub/logger';
const logger = loggerStub.getLogger();
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
    fc;
    twc;
    table;
    name;
    allFieldNames = [];
    fieldsList = [];
    /**
     * labels for all the fields
     */
    labels = {};
    pc;
    allSettings = {};
    /**
     * Controller of field sequencing. The underlying data structure for this table is non-standard.
     * While the table as seqNo and name, and label as fields, the underlying data is an array of field names
     * Hence we need tp pre and posy process the underlying data
     */
    fieldSeqController;
    constructor(
    /**
     * controller for this settings panel
     */
    fc, 
    /**
     * table controller for this report
     */
    twc, table) {
        this.fc = fc;
        this.twc = twc;
        this.table = table;
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
                payload: { reportName: this.table.reportName },
                callback: (vo) => {
                    this.settingsReceived(vo);
                },
            });
            /**
             * we need to change the settings as and when the user changes the report-variant
             */
            this.fc.addEventListener(VARIANT_NAME, 'change', (evt) => {
                console.info(evt);
                this.variantChanged(evt.newValue);
            });
        }
    }
    settingsReceived(vo) {
        this.allSettings = {};
        if (!vo || !vo.list) {
            return;
        }
        const names = [];
        for (const { variantName, settings } of vo
            .list) {
            this.allSettings[variantName] = settings;
            names.push({ value: variantName, label: variantName });
        }
        const f = this.fc.getChild(VARIANT_NAME);
        f.setList(names);
        /**
         * setList() would set the first value to the field as we have marked the field as mandatory.
         * that would in turn trigger this.variantChanged because we have registered that as a listener for that event
         */
    }
    /**
     * call report service with this report
     */
    variantChanged(name) {
        const settings = this.allSettings[name];
        if (!settings) {
            logger.error(`variant name is set to "${name}", but no settings found for this variant. Error in setting drop-downs?`);
            return;
        }
        /**
         * settings has the right Vo for our form, except that the "fields": string[] needs to be replaced fieldSequences: FieldRow[]
         */
        const vo = { ...settings };
        vo[FIELD_SEQUENCES] = this.toFieldRow(settings.fields);
        delete vo.fields;
        this.fc.setData(vo);
    }
    setFieldsAndLabels() {
        this.fieldsList = [];
        this.allFieldNames = [];
        this.labels = {};
        if (this.table.columns) {
            for (const { name, label } of this.table.columns) {
                this.fieldsList.push({ value: name, label });
                this.allFieldNames.push(name);
                this.labels[name] = label;
            }
        }
        else if (this.table.children) {
            for (let { name, label } of this.table.children) {
                if (!label) {
                    label = '';
                }
                this.fieldsList.push({ value: name, label });
                this.allFieldNames.push(name);
                this.labels[name] = label;
            }
        }
        else {
            logger.error('List configuration is not yet designed to handle dynamic columns');
        }
    }
    doFilter() {
        let maxRows = this.fc.getFieldValue(MAX_ROWS);
        /**
         * There are three tables : FIELDS, FILTERS and SORTS
         */
        /**
         * Step 1: sort the fields based on seqNo and make an array of field names
         */
        let tec = this.fc.getController(FIELD_SEQUENCES);
        const fieldRows = tec.getData();
        arrangeFields(fieldRows);
        tec.setData(fieldRows);
        let fields = getNames(fieldRows);
        if (fields.length == 0) {
            fields = undefined;
        }
        this.twc.resetColumns(fields);
        /**
         * Step 2: we are yet to provide feature to delete a row.
         * as of now, we will just send it as-it-is
         */
        tec = this.fc.getController(FILTERS);
        const filters = tec.getData();
        /**
         * step 3: sorts also does not have delete-row feature
         */
        tec = this.fc.getController(SORTS);
        const sorts = tec.getData();
        /**
         * prepare the payload
         */
        const payload = { fields, filters, sorts };
        if (maxRows) {
            payload[MAX_ROWS] = maxRows;
        }
        const serviceName = 'filter_' + this.table.reportName;
        const options = {
            payload,
            targetPanelName: this.name,
        };
        this.pc.requestService(serviceName, options);
    }
    /**
     * to be invoked after the view-component renders the panel
     */
    rendered() {
        this.fc.formRendered();
        this.fieldSeqController = this.fc.getController(FIELD_SEQUENCES);
        /** set data to the fields selection table */
        this.fieldSeqController.setData(this.toFieldRow(this.allFieldNames));
    }
    toFieldRow(names) {
        const data = [];
        let seqNo = 10;
        const selectedOnes = {};
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
    getConfigPanel() {
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
                },
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
                        },
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
                        },
                    ],
                },
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
                        },
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
                },
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
                        },
                        {
                            name: 'descending',
                            label: 'Sort Descending?',
                            compType: 'field',
                            isRequired: true,
                            renderAs: 'check-box',
                            valueType: 'boolean',
                        },
                    ],
                },
                {
                    name: GO_BUTTON,
                    compType: 'button',
                    buttonType: 'primary',
                    label: 'Get Data',
                    onClick: '',
                },
            ],
        }; /* as Panel */
        //add the listOptions to the two fields
        let field = panel.children[2].children[0];
        field.listOptions = this.fieldsList;
        field = panel.children[3].children[0];
        field.listOptions = this.fieldsList;
        if (this.table.reportName) {
            const variantField = {
                name: VARIANT_NAME,
                compType: 'field',
                valueType: 'text',
                isRequired: true,
                renderAs: 'select',
                label: 'Report',
            };
            panel.children = [variantField, ...panel.children];
        }
        return panel;
    }
}
function arrangeFields(fields) {
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
        }
        else {
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
function getNames(fields) {
    let names = [];
    for (const a of fields) {
        if (!a.seqNo) {
            break;
        }
        names.push(a.field);
    }
    return names;
}
//# sourceMappingURL=reportConfigurator.js.map