"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportConfigurator = void 0;
const logger_1 = require("../logger-stub/logger");
const logger = logger_1.loggerStub.getLogger();
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
class ReportConfigurator {
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
        this.allFieldNames = [];
        this.fieldsList = [];
        /**
         * labels for all the fields
         */
        this.labels = {};
        this.allSettings = {};
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
exports.ReportConfigurator = ReportConfigurator;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVwb3J0Q29uZmlndXJhdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9jb250cm9sbGVyL3JlcG9ydENvbmZpZ3VyYXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFxQkEsa0RBQW1EO0FBQ25ELE1BQU0sTUFBTSxHQUFHLG1CQUFVLENBQUMsU0FBUyxFQUFFLENBQUM7QUFFdEMsTUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDO0FBQzNCLE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQztBQUMxQixNQUFNLGVBQWUsR0FBRyxnQkFBZ0IsQ0FBQztBQUN6QyxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUM7QUFDdEIsTUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDO0FBQzdCLE1BQU0sWUFBWSxHQUFHLGVBQWUsQ0FBQztBQUNyQyxNQUFNLG1CQUFtQixHQUFHLG9CQUFvQixDQUFDO0FBQ2pELE1BQU0sV0FBVyxHQUFHO0lBQ2xCLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFO0lBQ2pDLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFFO0lBQ3RDLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFO0lBQ2xDLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsdUJBQXVCLEVBQUU7SUFDL0MsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxjQUFjLEVBQUU7SUFDckMsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSwwQkFBMEIsRUFBRTtJQUNqRCxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRTtJQUNqQyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRTtJQUNwQyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FB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