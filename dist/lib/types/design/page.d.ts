/**
 * The visual aspect of the client-app is implemented with a hierarchy of visual components.
 * This hierarchy is similar to the Document Object Model (DOM) of an HTML file.
 * Layout is the top level component that houses everything else.
 * The child components may be either leaf-components, or containerComponents that contain child-components.
 *
 * Each component has its pre-defined set of attributes. In addition, a container component has pointers to its child component instances
 * This file defines the shape of this hierarchical model.
 * This is like the .html file that specifies all the attributes of the DOM.
 *
 */
import { FieldRendering, FormOperation, SortBy, StringMap, VisualWidth, Values, ValueType, Value, BaseView, Markups, ValueRenderingDetails, Comparator, FormController, SimpleList } from '..';
/**
 * basic attributes of a Page.
 * This type-alias is created to re-use the base attributes for PageAlterations
 */
export type PageAttributes = {
    name: string;
    /**
     * form that defines meta data for the data-model behind this page.
     * it is possible that the page has no form at all. In that case, no 'fields' are to be rendered.
     * if no form is specified, it is still possible to have child-forms (table-panels) in the page
     */
    formName?: string;
    /**
     * is this page designed to edit the data model?
     */
    isEditable?: boolean;
    /**
     * page may have title that may embed the value of a field.Hence we provide prefix, field and suffix.
     */
    titlePrefix?: string;
    /**
     * page may have title that may embed the value of a field.Hence we provide prefix, field and suffix.
     */
    titleField?: string;
    /**
     * page may have title that may embed the value of a field.Hence we provide prefix, field and suffix.
     */
    titleSuffix?: string;
    /**
     * edit page typically considers menu as a distraction
     */
    hideMenu?: boolean;
    /**
     * edit page typically considers modules options as a distraction
     */
    hideModules?: boolean;
    /**
     * input field names. boolean to indicate if it is required/mandatory
     * for example:
     * {
     *  field1: true,
     *  field2: false
     * }
     */
    inputs?: StringMap<boolean>;
    /**
     * if the page is common for create and update, then indicate so with this attribute
     * Page will fetch the row on load, if the key is provided. And the
     */
    inputIsForUpdate?: boolean;
    /**
     * can this page be offered if the user has not logged-in?
     */
    serveGuests?: boolean;
    /**
     * actions to be taken after loading this page.
     * If specified, each action must have been defined in the actions collection
     */
    onLoadActions?: string[];
    /**
     * action to be taken before the page is closed
     * If specified, it must be defined as an action in this.actions
     */
    onCloseAction?: string;
    /**
     * various actions (response to events) defined in this page.
     * This is the definition of the actions. Individual components would use the name of a defined action
     */
    actions?: StringMap<Action>;
    /**
     * if any action is to be triggered at the page level when any field is changed/changing etc...
     * this would be in addition to any triggers that are specified at the form/field level
     */
    triggers?: EventAction[];
    /**
     * functions that are used in this page. They are typically used in function-actions.
     * But they may also be use in other functions
     * boolean represents whether the function is pageScoped. If true, the function is of type PageFunction.
     * if false, this function is a FormFunction
     */
    /**
     * buttons to be rendered at the left of the button panel
     */
    leftButtons?: Button[];
    /**
     * buttons to be rendered at the middle/center
     */
    middleButtons?: Button[];
    /**
     * buttons to be rendered on the right
     */
    rightButtons?: Button[];
    /**
     * by default, buttons are rendered at the bottom.
     * However, like in a list-page, it may make more sense to render them at the top
     */
    renderButtonsBeforeData?: boolean;
};
/**
 * A Page renders data from one or more forms, inside of a layout.
 */
export type Page = PageAttributes & {
    /**
     * panel where the page renders the data that is bound to.
     */
    dataPanel: Panel;
};
/**
 * details of an event that is passed to the controller to handle
 */
export type EventDetails = {
    /** unique  name of the control that triggered this */
    viewName: string;
    eventName: EventName;
    /**
     * view that triggered this
     */
    view: BaseView;
    /**
     * form control associated with this event
     * certainly populated if this is passed to the run-time event function
     */
    fc: FormController;
    /**
     * for changing and changed events
     */
    newValue?: Value;
    /**
     * for changing and changed events
     */
    newValidity?: boolean;
    /**
     * any event-specific parameters
     */
    params?: Values;
};
export type EventName = 'change' | 'changing' | 'click';
/**
 * specify event handlers for fields/columns
 */
export type EventAction = {
    eventName: EventName;
    /**
     * name of table if this field is a column.
     * omitted if this is for a field in the main form
     */
    tableName?: string;
    controlName: string;
    actionName: string;
};
/**
 * Common properties of any component. In a class-sense, this is the base class
 */
export type BaseComponent = {
    name: string;
    compType: ComponentType;
    /**
     * parent may use this to assign appropriate style based on this width
     */
    width?: VisualWidth;
    /**
     * label may have different meaning for different elements
     */
    label?: string;
    /**
     * any action to be taken onClick for this node?
     *
     */
    onClick?: string;
    /**
     * a specific component may be designed completely differently from the standard ones.
     * however, the html must still follow the naming conventions for data-attributes and any other requirement for that component.
     * this is the name of the html file, that has the actual htmls
     */
    customHtml?: string;
};
/**
 * component type
 */
export type ComponentType = 'button' | 'field' | 'panel' | 'static' | 'table' | 'tabs';
/**
 * meta data for a button
 */
export type Button = BaseComponent & {
    compType: 'button';
    buttonType: 'primary' | 'secondary' | 'navigation' | 'custom';
    label?: string;
    icon?: string;
    tooltip?: string;
    enableWhen?: 'error' | 'valid' | 'rowsSelected';
    /**
     * additional parameters specific to this button
     */
    buttonOptions?: StringMap<unknown>;
};
/**
 * Field is a component that is bound to a data-element at run time.
 */
export type DataField = BaseComponent & {
    compType: 'field';
    isRequired: boolean;
    valueType: ValueType;
    /**
     * how this field is to be rendered
     */
    renderAs: FieldRendering;
    /**
     * value schema is strongly advised to ensure that the value entered by the client is valid
     * however, in situations where a temp/local field is used, it may be enough just to check that the value is is of the right type.
     * if omitted, a value for this field is validated to ensure that it is of the specified valueType
     */
    valueSchema?: string;
    defaultValue?: string;
    /**
     * to be used for output fields only.
     * this is the name of a pre-defined formatter
     */
    valueFormatter?: string;
    label?: string;
    /**
     * attributes for rendering the label
     */
    labelAttributes?: Markups;
    /**
     * if this field is a drop-down.
     * to be used only if the list is simple, and is not a common one across several other fields.
     * also useful if the field is synthesized at run time.
     */
    listOptions?: SimpleList;
    /**
     * name of the list that is defined in valueLists collection.
     * If specified, it must be present in valueLists collection.
     * ignored if listOptions are specified
     */
    listName?: string;
    /**
     * field name that has the value for the key for the above list. e.g. countryId would be the listKeyFieldName for field "state"
     */
    listKeyFieldName?: string;
    /**
     * in case the list is keyed, but this field uses a deign-time fixed value for the key.
     * e.g. reportField uses a keyed-list named reportFields, and the current field is mean for a reportName="users"
     * in such a case, listKeyFieldName should not be specified, but listKeyValue="users"
     */
    listKeyValue?: string | number;
    /** any custom action to be taken on change of this field. If specified, this action must be defined in the page.ts */
    onChange?: string;
    /**
     * any custom action to be taken while user keeps typing value for this field.
     * If specified, this action must be defined in the page.ts
     */
    onBeingChanged?: string;
    hint?: string;
    /**
     * text field may be for a password
     */
    isPassword?: true;
    /** for image field */
    imageNamePrefix?: string;
    /** for image fields */
    imageNameSuffix?: string;
    /**
     * used by the client-side for rendering
     */
    width?: VisualWidth;
};
/**
 * panel is a container that contains other components.
 * Contents of a page are organized into its dataPanel at the top.
 */
export type Panel = BaseComponent & {
    compType: 'panel';
    /**
     * contents of this panel
     */
    children: BaseComponent[];
    /**
     * name of the child-form that defines the data fields in this panel.
     * Important to note that the name of the panel is the name with which ths sub-form is known to the parent-form
     * if this is provided, all the data-bound components inside this panel are controlled by a new form-controller than the this panel is part of.
     * This is how we provide arbitrary data-structure to be managed in a page.
     * The panel hierarchy mimics the form-structure of the underlying data being associated with this page
     */
    childFormName?: string;
};
/**
 * any leaf component that is not bound to any data.
 */
export type StaticComp = BaseComponent & {
    compType: 'static';
    staticType: StaticCompType;
    content?: string;
    imageName?: string;
    elementOptions?: StringMap<unknown>;
};
export type StaticCompType = 'image' | 'content' | 'line' | 'custom';
/**
 * Data table that renders from tabular data (rows and columns) in read-nly mode
 * There may be a feature to select rows, but the data itself is not editable
 * there are three ways to specify how the columns are to rendered.
 * 1. default is "dynamic". The table is rendered based on run-time tabular data.
 *  columns are decided based on the name-value pairs in the first row of the data.
 * column header is formatted based on the names. Numeric column is right justified.
 *
 * 2. using columnsToRender. Several features are available to format the text as well as specify markups for rendering.
 * Column values are essentially rendered as text, but with simple css-based markups
 *
 * 3. using columnComponents. These are regular pre-defined view components.
 * They are rendered inside the cells without the labels.
 * For example a boolean value can be rendered as a check-box.
 * All editable fields are disabled (essentially  readonly)
 *
 */
export type TableViewer = BaseComponent & {
    compType: 'table';
    /**
     * Table view is designed to be read-only
     */
    editable: false;
    /**
     * can the user do a quick-search on the rendered rows on the client?
     * if set to true, renders rows are filtered to show only the ones that contain the text being searched on in any of their columns
     */
    searchable?: boolean;
    /**
     * if set to true, user can click on the header of any of the column to sort the rows by that column.
     * rows are sorted in ascending order first. A click on the same column would result in sort in descending order.
     * note that the rows can be sorted on only on columns. multi-column sort facility is not designed yet
     */
    sortable?: boolean;
    /**
     * can the end-user choose columns to render, filter conditions and sort orders?
     * if set to true, a configuration panel is rendered at run time.
     * Table rows are rendered based in these selection criterion set by the user.
     */
    configurable?: boolean;
    /**
     * If this panel is designed to show a pre-designed dynamic report.
     * Saved report configurations are fetched on-load.
     * Also, the default layout for the logged-in user is fetched automatically.
     * Relevant only if configurable=true
     */
    reportName?: string;
    /**
     * a form-based table comes with several other features.
     * strongly recommended that the table be based on a form.
     * But there are certainly situations where a form may not be required
     */
    formName?: string;
    /**
     * can the user select rows?
     * Name of the boolean-valued-field that represents the selection status
     */
    selectFieldName?: string;
    /**
     * relevant if rows can be selected
     */
    minRows?: number;
    /**
     * relevant if rows can be selected
     */
    maxRows?: number;
    /**
     * if min/max rows selection is violated, this is the errorId to be used to flash a message
     */
    errorId?: string;
    /**
     * action to be invoked when user clicks on a row.
     * Should be used if and only if no cells have meaning on click.
     */
    onRowClick?: string;
    /**
     * leaf elements can serve as columns. Not panels and tables.
     * Note that the selectField, if specified, should not be defined as a column.
     * Value of that field is automatically linked to the selection status of the rows
     * NOTE: the components are rendered in the usual field-view mode.
     * Chose this member only if that is what is needed. Consider using columnsToRender instead.
     * It is an error to specify both children and columns
     */
    children?: LeafComponent[];
    /**
     * since the columns are meant for read/view, it is more appropriate to specify how the column values are to be rendered.
     * It is an error to specify both children and columns
     */
    columns?: ValueRenderingDetails[];
    /**
     * action buttons. May be for the selected rows or independent of the rows
     */
    actionButtons?: Button[];
    /**
     * action: label maps for dynamic action menu for each row
     */
    rowActions?: StringMap<string>;
    /**
     * Panel that provides the configuration parameters for fetching rows for this table.
     * relevant only if configurable="true".
     * If this panel is not provided, a default panel is rendered.
     */
    configurationPanel?: Panel;
};
/**
 * Data table that renders from tabular data (rows and columns) in read-nly mode
 * There may be a feature to select rows, but the data itself is not editable
 */
export type TableEditor = BaseComponent & {
    compType: 'table';
    /**
     * Table view is designed to be read-only
     */
    editable: true;
    /**
     * leaf elements can serve as columns. Not panels and tables.
     * Note that the selectField, if specified, should not be defined as a column.
     * Value of that field is automatically linked to the selection status of the rows
     */
    children: LeafComponent[];
    /**
     * a form-based table comes with several other features.
     * strongly recommended that the table be based on a form, but there are certainly situations where a form may not be required
     */
    formName?: string;
    /**
     * relevant if rows can be selected
     */
    minRows?: number;
    /**
     * relevant if rows can be selected
     */
    maxRows?: number;
    /**
     * if min/max rows selection is violated, this is the errorId to be used to flash a message
     */
    errorId?: string;
    /**
     * can the end-user add a row?.
     */
    rowsCanBeAdded?: boolean;
};
export type Tabs = BaseComponent & {
    compType: 'tabs';
    /**
     * if the tabs have editable fields,then we may want to
     * render the tab to indicate whether any fields within that is in error
     */
    trackErrorStatus?: boolean;
    children: Tab[];
};
/**
 * panel that is a direct child of a tab container.
 * a tab needs to be controlled by its tabs parent
 */
export type Tab = Panel & {
    /**
     * tab label is different from label for the panel
     */
    tabLabel: string;
    /**
     * icon is rendered before the label
     */
    icon?: string;
};
export type ContainerComponent = Panel | Tabs | Tab;
export type LeafComponent = DataField | Button | StaticComp;
/**
 * A piece of work/task that is typically triggered through an event
 */
export type Action = {
    name: string;
    type: ActionType;
    /**
     * optional next action to be taken if this action succeeds
     */
    onSuccess?: string;
    /**
     * optional next action to be taken if this action fails
     */
    onFailure?: string;
    /**
     * service call is generally asynchronous, and likely to take some time.
     * should the UX be disabled till the service response is received?
     */
    toDisableUx?: boolean;
};
export type ActionType = 'function' | 'form' | 'service' | 'navigation';
/**
 * action that requires specific programming logic. This is implemented as a function in the app
 */
export type FunctionAction = Action & {
    type: 'function';
    /**
     * function name must be one of the functions defined in this page
     */
    functionName: string;
    /** optional parameters to be passed to the function. must match the published api of that function */
    params?: {};
};
/**
 * form related action, like fetching and saving form data
 */
export type FormAction = Action & {
    type: 'form';
    formOperation: FormOperation;
};
/**
 * get data for this form.
 */
export type GetAction = FormAction & {
    formOperation: 'get';
    /**
     * optional. DO NOT specify this if the get is based on key fields. Specify this ONLY IF you want to get dat based on other fields
     * field values to be provided as input to the API to get data.
     * boolean indicates if the parameter is required/mandatory
     */
    params?: StringMap<boolean>;
};
/**
 * create a new row/entity for the form
 */
export type CreateAction = FormAction & {
    formOperation: 'create';
};
/**
 * modify/update a row/entity for the form
 */
export type UpdateAction = FormAction & {
    formOperation: 'update';
};
/**
 * modify/update a row/entity for the form
 */
export type DeleteAction = FormAction & {
    formOperation: 'delete';
};
/**
 * create or update depending on the mode in which this is called.
 * Useful when we can use the same page for create as well s update operation
 */
export type SaveAction = FormAction & {
    formOperation: 'save';
};
/**
 * change the attribute of a component
 */
export type ViewAction = Action & {
    actionType: 'view';
    compName: string;
    attribute: string;
    value: unknown;
};
/**
 * show or hide a component
 */
export type ShowAction = ViewAction & {
    attribute: 'show';
    value: boolean;
};
/**
 * enable or disable a component
 */
export type EnableAction = ViewAction & {
    attribute: 'enable';
    value: boolean;
};
/**
 * get data rows fora form
 */
export type FilterAction = FormAction & {
    formOperation: 'filter';
    /**
     * name of the child-form (not the form name associated with that child)
     */
    childName: string;
    /**
     * fields and the conditions based on which the rows for the child are fetched
     */
    filterParams?: FilterParameters;
    /**
     * sorting of rows based on fields
     */
    sortBy?: SortBy[];
    fields?: string[];
    maxRows?: number;
};
/**
 * parameters based on which filter conditions are assembled at run time
 * At run time, the data controller is queried for dat for field (and toField if required) to get the values to be compared
 * a condition is going to be like "field1 = 'abcd'" or "field 2 Between 32 and 45"
 */
export type FilterParameters = {
    [field: string]: {
        comparator: Comparator;
        /**
         * if true, it is a run-time error if the field has no value
         */
        isRequired?: boolean;
        /**
         * required if comparator is "between"
         */
        toField?: string;
    };
};
/**
 * request a specific service
 */
export type ServiceAction = Action & {
    type: 'service';
    serviceName: string;
    /**
     * If the payload is to be prepared based on the form.
     * If true, the form is validated first.
     * Action is aborted after showing the messages if the form is invalid.
     */
    submitForm?: boolean;
    /**
     * ignored if submitForm=true.
     * If the payload is to be prepared using selected field/table names.
     * Use the boolean value to indicate if the value for the field/table is required.
     * If a required value is not found, an error message is raised at run time, and the service is not requested.
     *
     */
    params?: StringMap<boolean>;
    /**
     * function to be executed just before requesting this service.
     * this function should be a RequestFunction type.
     * if the function returns falsy, then the service is not requested
     */
    fnBeforeRequest?: string;
    /**
     * function to be called after the response is received (request returns) but before the payload is processed
     * this function is like an intercept that can alter the response before it is processed
     * it should be of type ResponseFunction
     */
    fnAfterResponse?: string;
    /**
     * is this service meant to get data for a specific child rather than the entire page?
     * when a service returns, the payload is assumed to be meant for the entire page.
     * This means the data for the page is first reset, and only the data received is set to all the page elements.
     */
    targetChildName?: string;
};
/**
 * event triggered to navigate to a page or a module
 */
export type NavigationAction = Action & {
    type: 'navigation';
    /**
     * user is warned and is asked to reconfirm before taking this action, in case the form is modified by the user
     */
    warnIfModified?: boolean;
    /**
     * defaults to current layout. Specified if the layout needs to be changed
     * if menu is not specified in this action, then the defaults set at the layout level will be used
     */
    layout?: string;
    /**
     * specified if the module is different from the current one
     */
    module?: string;
    /**
     * menu name (in turn decides the page to be opened).
     * not specified if this is a close-operation.
     * This arrangement allows us to have the same page being opened with different input parameters.
     * for example subjectSave page is used for both edit and add
     */
    menuName?: string;
    /**
     * parameters to be passed to the page associated with the menu item.
     *
     * a parameter may be like id:2, or id:'abcd' or id:'$name'
     * where name is the name of the field from which value is extracted.
     * if the action is emitted from a table then this value will come from that row
     */
    params?: Values;
    /**
     * relevant if menuName is specified. if true, the current page is not closed, but is hidden.
     * current page is made visible when the new page closes.
     */
    retainCurrentPage?: boolean;
    /**
     * relevant if retainCurrentPage=true. new page is opened as modal on the current page
     */
    openAsModal?: boolean;
    /**
     * relevant if retainCurrentPage = true. action to be taken when this page is un-hidden/activated again.
     */
    onReactivation?: string;
    /**
     * one of those rare cases when this action requires that the navigation path be reset.
     * that is, if this page was opened after retaining the old page, and we still do not want to go back to that page!!!
     */
    erasePagesOnTheStack?: boolean;
};
/**
 * meta data for a button that is meant to navigate to a menu item
 */
export type MenuButton = {
    /**
     *  unique name. typically xxxButton
     */
    name: string;
    /**
     * on click, this menu id is opened. If relevant, key fields of the form associated with the page/panel are sent as parameters
     */
    menuName: string;
    /**
     * if icon is used, then the label is used as hint
     */
    label?: string;
    /**
     * used for non-fields.
     */
    icon?: string;
    /**
     * parameters to be passed, if different from the primary keys of the form.
     * note that the value should be of the form '$fieldName' if the value of a field is to be sent.
     */
    params?: Values;
};
