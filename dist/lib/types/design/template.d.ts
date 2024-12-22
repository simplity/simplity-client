import { FilterCondition, FilterRequestVo, MenuButton, SortBy, StringMap } from '..';
/**
 * template for a simple master that creates three pages:
 * 1. masterList : list of all rows. Each row has view and edit buttons.
 * 2. masterView : all fields are rendered as output fields. edit and new buttons are provided
 * 3. masterSave : common page for add/edit.
 *
 * Ensure that the menu items are added with the naming convention followed
 * masterList, masterView, masterAdd (with page name = masterSave) and MasterEdit (page=masterSave)
 */
/**
 * all template types
 */
export type PageTemplateType = 'master' | 'list' | 'view' | 'save' | 'grid';
/**
 * base for all page templates. templates are typical page-layouts used in a project.
 * We design meta-data for such a page from which the actual page is generated.
 *
 */
export type PageTemplate = {
    type: PageTemplateType;
    /**
     * MUST match the name of the file.
     * e.g nam="customer" then the file name is customer.view.ts., menu name is customer-view
     */
    name: string;
    /**
     * label to be used for this entity.
     */
    label: string;
    /**
     * record/form that defines the data structure for this page.
     * server should have defined either a record, or a form with this name.
     */
    formName: string;
    /**
     * menu to be used on close/cancel.
     * default is to just close and leave it to the menu manager to decide what page to show next,
     * Generally, view/add/edit page should go back to list page on close.
     */
    menuToGoBack?: string;
    /**
     * by default, key fields are used as input fields for view/update.
     * Any additional field values, like department, customerType.
     * Typically these fields are hidden/disabled in the page, so that the user is restricted to that value
     * Fields may also be used as selection/filtering criterion passed from one page to the other
     * boolean is true if value is required for the field. false if the field value is optional
     */
    additionalInputParams?: StringMap<boolean>;
};
/**
 * configuring how a list page is to be rendered.
 */
export type ListConfiguration = {
    /**
     * Unique name, usually the formName, that identifies this list
     */
    listName: string;
    /**
     * a meaningful name given to this configuration set up. Must be unique across all configurations for a given listName
     */
    configName: string;
    /**
     * id of the user for whom this is meant for. If specified, this will be visible only to the specified user
     */
    columnsToShow?: string[];
    /**
     * sort the rows..
     */
    sortBy?: SortBy[];
    filters?: FilterCondition[];
};
export type ListPage = PageTemplate & {
    type: 'list';
    /**
     * subset of columns in the form to be shown as part of the list
     * default is to show all of them
     */
    columnNames?: string[];
    /**
     * navigate to this menu item when the row is clicked.
     * to be used only if NO clickable elements are used.
     * If clickable elements are used, then this action, if required, has to be designed as a separate clickable column
     */
    onRowClickMenu?: string;
    /**
     * button to add/create/new
     */
    newButton?: MenuButton;
    /**
     * menu-name mapped to the label to be rendered.
     * These may be rendered as buttons on the row, or as dynamic menu on mouse-over a row etc..
     */
    rowActionMenus?: StringMap<string>;
    /**
     * if the list is to be filtered based on the values of some of the fields.
     * specify the filter conditions for each field.
     */
    filterParams?: FilterRequestVo;
    /**
     * should the user be allowed to configure how the list is rendered for him/her
     */
    allowConfiguration?: boolean;
};
export type GridPage = PageTemplate & {
    type: 'grid';
    /**
     * form name is mandatory for grid
     */
    formName: string;
    /**
     * name of the child table/grid that is to be edited. Refer to form.ts on the server side for the main form.
     */
    gridName: string;
    /**
     * fields/columns to be shown in each row
     */
    columns: GridColumn[];
    /**
     * if the list is to be filtered based on the values of some of the fields.
     * specify the filter conditions for each field.
     * Page will render these fields for the user to enter values
     */
    filterParams?: FilterRequestVo;
};
export type GridColumn = {
    name: string;
    isEditable: boolean;
};
export type ViewPage = PageTemplate & {
    type: 'view';
    /**
     * button to navigate to page where the details viewed here are edited
     */
    editButton?: MenuButton;
    /**
     * button to create a new entity
     */
    createButton?: MenuButton;
    /**
     * additional fields, other than the standard fields like generated key, to be not rendered
     */
    hideFields?: string[];
    /**
     * in case fields have to be grouped into tabs
     */
    tabs?: {
        name: string;
        label: string;
        icon?: string;
        fields: string[];
    }[];
};
export type SavePage = PageTemplate & {
    type: 'save';
    /**
     * additional fields, other than the standard fields like generated key, to be not rendered
     */
    hideFields?: string[];
    /**
     * in case fields have to be grouped into tabs
     */
    tabs?: {
        name: string;
        icon?: string;
        label: string;
        fields: string[];
    }[];
};
/**
 * template for a simple master that creates three pages:
 * 1. masterList : list of all rows. Each row has view and edit buttons.
 * 2. masterView : all fields are rendered as output fields. edit and new buttons are provided
 * 3. masterSave : common page for add/edit.
 *
 * Ensure that the menu items are added with the naming convention followed
 * masterList, masterView, masterAdd (with page name = masterSave) and MasterEdit (page=masterSave)
 */
export type MasterPage = PageTemplate & {
    type: 'master';
    /**
     * fields/columns to be shown in each row. default is to show all
     */
    columnNames?: string[];
    /**
     * additional fields, other than the standard fields like generated key, to be not rendered
     */
    hideFields?: string[];
    /**
     * rows in the list may have to show a column from a referenced table,
     * and hence may use a view instead of the base table
     */
    listFormName?: string;
    /**
     * view page may want render fields from other tables through a view.
     * Note that the view page automatically handles things like department-name instead of department-id.
     * Use this for more complex cases. like total students enrolled etc..
     */
    viewFormName?: string;
    /**
     * fields to be rendered for the user to enter values based on which the rows are to be listed
     * note that these fields must be from the same form/record
     */
    filterParams?: FilterRequestVo;
};
