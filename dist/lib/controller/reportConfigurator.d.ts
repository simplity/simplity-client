import { FormController, Panel, TableViewer, TableViewerController } from 'simplity-types';
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
export declare class ReportConfigurator {
    /**
     * controller for this settings panel
     */
    private readonly fc;
    /**
     * table controller for this report
     */
    private readonly twc;
    private readonly table;
    private readonly name;
    private allFieldNames;
    private fieldsList;
    /**
     * labels for all the fields
     */
    private labels;
    private readonly pc;
    private allSettings;
    /**
     * Controller of field sequencing. The underlying data structure for this table is non-standard.
     * While the table as seqNo and name, and label as fields, the underlying data is an array of field names
     * Hence we need tp pre and posy process the underlying data
     */
    private fieldSeqController?;
    constructor(
    /**
     * controller for this settings panel
     */
    fc: FormController, 
    /**
     * table controller for this report
     */
    twc: TableViewerController, table: TableViewer);
    private settingsReceived;
    /**
     * call report service with this report
     */
    private variantChanged;
    private setFieldsAndLabels;
    doFilter(): void;
    /**
     * to be invoked after the view-component renders the panel
     */
    rendered(): void;
    private toFieldRow;
    /**
     * a panel component that is to be rendered as the Configuration Panel for this table
     * Returned panel uses naming conventions to ensure that a page can have multiple such panels
     * @returns
     */
    getConfigPanel(): Panel;
}
