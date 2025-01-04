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
            console.error('List configuration is not yet designed to handle dynamic columns');
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