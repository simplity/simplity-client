import { Alert, BaseComponent, Button, DataField, FormController, LeafComponent, NavigationAction, Page, Panel, SimpleList, StaticComp, StringMap, Tab, TableEditor, Tabs, Value, ValueRenderingDetails, Values } from '..';
/**
 * An App-view is the outer most container component inside of which the relevant view components are laid out
 * When an AppView instance is created, it should not have any child layouts in that.
 * a LayoutView will be added later by the app controller
 */
export interface AppView {
    /**
     * creates, adds and renders a layoutView as its only child, if required. View is NOT created if the index.html already has the layout rendered.
     * (layoutIsEmbedded mode)
     * NOTE: document.createElement of standard DOM just creates an element, but it does not add it to the DOM.
     * This method adds the created element as its only child element, after deleting the existing on if any.
     * @param layout required, even if the layout view is embedded into the html.
     * @param startWith module to start with. defaults to the first one in the layout
     * @returns layoutView component
     *
     */
    /**
     * show a message as per the chosen design to show/flash message in a non-intrusive way
     * @param alert
     */
    showAlert(alert: Alert): void;
    /**
     * Show a message/question to get user's response/choice
     * @param text message text to be shown
     * @param choices options to be shown as buttons to choose from
     * @returns 0-based index of the option chosen by the user
     */
    getUserChoice(text: string, choices: string[]): Promise<number>;
    /**
     * render a panel as pop-up. the panel should not be part of the dom.
     * this method adds the panel to the dom.
     * Note that this method is for a panel, and NOT for a page. a popup page is handled through regular navigation action
     * @param panel to be rendered. It should not be part of the DOM.
     */
    renderAsPopup(panel: PanelView): void;
    /**
     * closes the panel by removing it from dom.
     * This method is to be called after a call to renderAsPopup.
     * no error is thrown if there was no panel was rendered as a popup
     */
    closePopup(): void;
    /**
     * render this page. It should first create an instance of the PageView, create a PageController using app.newPc() and then render the page contents
     * @param pageName
     */
    renderPage(pageName: string, pageParams?: Values): void;
    /**
     * navigate to the desired page based on the details in this action
     * @param action page and other details
     */
    navigate(action: NavigationAction): void;
    /**
     * It is possible that a layout shows the page title outside of the page area.
     * this method is to be called to set the title. Note that this is NOT the title of the window
     * @param title
     */
    renderPageTitle(title: string): void;
    /**
     * layout may display some details like logged-in user etc..
     * @param values
     */
    renderContextValues(values: StringMap<string>): void;
}
export type NavigationParams = {
    layout?: string;
    module?: string;
    menuItem?: string;
    params?: Values;
};
/**
 * this is typically the only child of an AppView that would render all other components in a pre-defined layout.
 */
export interface LayoutView {
}
/**
 * A view component that renders menu groups.
 * A menu group has a list of Menu Items
 */
/**
 * menu item is a clickable component that typically navigates the user to a specific page
 * a menu item may be rendered in more than one groups
 */
/**
 * Page View. Represents the view-component for a rendered page.
 */
export interface PageView {
    /**
     * meta data for this page
     */
    readonly page: Page;
    /**
     * run time parameters passed to this page
     */
    readonly params?: Values;
    /**
     * whether the page buttons are to be rendered or hidden
     * @param show true to show and false to hide
     * @returns
     */
    showButtons(toShow: boolean): void;
    /**
     * show alerts
     * @param alerts
     */
    alert(alerts: Alert[]): void;
    /**
     * disable user interaction.
     * Typically used during page loads/updates
     */
    disableUx(): void;
    /**
     * enable user interaction.
     * Typically used during page loads/updates
     */
    enableUx(): void;
}
/**
 * Abstract/Base Control (a view-component that is part of a page)
 */
export interface BaseView {
    readonly name: string;
    readonly comp: BaseComponent;
    /**
     * modify the way the view is rendered by changing its view-attribute.
     * ignored with a warning if the setting is not relevant for the control
     * @param settings name-value pairs for valid attribute names
     */
    setDisplay(settings: DisplaySettings): void;
}
export type KnownDisplaySettings = 'hidden' | 'disabled' | 'classes' | 'error';
/**
 * attributes that can be set programmatically at run time
 */
export type DisplaySettings = KnownSettings & {
    [key: string]: any;
};
/**
 * attributes that can be set programmatically at run time
 */
type KnownSettings = {
    /**
     * default, false, is to render the control
     */
    hidden?: boolean;
    /**
     * default, false, is to enable the field
     */
    disabled?: boolean;
    /**
     * IMPORTANT: must be checked for !== undefined because '' has a different meaning than not setting it
     * set to '' to mark that this field is not in error.
     */
    error?: string;
};
/**
 * controls that do not contain other controls
 */
export type LeafView = FieldView | ButtonView | StaticView;
export type ContainerView = PanelView | TableViewerView | TableEditorView | TabsView;
/**
 * Field is a view control that is bound to a run-time data-element.
 * It may or may not be editable.
 */
export interface FieldView extends BaseView {
    /**
     * meta data for this button
     */
    readonly comp: DataField;
    /**
     * value is coming from the top.
     * It is not invoked when the data is changed by the UX.
     * The value is to be set, and if required, to be propagated to the view.
     * @param value value
     */
    setValue(value: Value): void;
    /**
     * get the validation status of the field as updated when it was changed last.
     * a validation is not forced.
     * @returns true if this field is valid as of now. false otherwise.
     */
    isValid(): boolean;
    /**
     * force a fresh validation. This may be required if the validation may depend on things outside of the field value
     */
    validate(): boolean;
    /**
     * relevant if the field requires a list of enumerated values.
     * ignored with a warning if the control does not use a list of values
     * @param list list of valid options.
     */
    setList(list: SimpleList): void;
    /**
     * get the current value
     */
    getValue(): Value;
}
/**
 * A clickable button for user to ask for some action
 */
export interface ButtonView extends BaseView {
    /**
     * meta data for this button
     */
    readonly comp: Button;
}
/**
 * A leaf control that is not bound to any data, but not a button
 */
export interface StaticView extends BaseView {
    /**
     * meta data for this button
     */
    readonly comp: StaticComp;
}
/**
 * panel is a container to render its child controls
 * it is a view component, and not a control, but is named that way for conformity with other similar components
 */
export interface PanelView extends BaseView {
    readonly comp: Panel;
    /**
     * in case this panel is associated with a child-form
     */
    readonly childFc?: FormController;
}
/**
 * Tab is a panel that is a direct child of a tabsGroup.
 */
export interface TabView extends BaseView {
    readonly comp: Tab;
}
/**
 * table renders tabular data, but does not allow any edits to the columns.
 * It can optionally have the facility to select a subset of rows.
 */
export interface TableViewerView extends BaseView {
    /**
     * remove all rendered rows. Header, if any, is to be retained.
     */
    reset(): void;
    /**
     * simplest way to render a tabular data, with no formatting options.
     * To be used for ad-hoc run-time data for which no pre-designed formatting can be applied
     * First row is scanned to get all the possible columns.
     * Name of the field itself is used as the label.
     * Number fields are rendered as right-aligned, while other are rendered as left-aligned
     * @param data
     */
    showData(data: Values[]): void;
    /**
     * render tabular data as output text with formatting/rendering
     * @param data
     * @param rendering columns are rendered based on these elements.
     * If a column is missing in the row-data, an empty string is assumed.
     * Any data element with no rendering is ignored
     */
    renderData(data: Values[], rendering: ValueRenderingDetails[]): void;
    /**
     * Render the data with maximum rendering/formatting options.
     * Columns are full-fledged leaf-components.
     * @param data rows of data to be rendered
     * @param columns child nodes to be rendered as columns.
     * Input fields, if any, will be rendered as disabled.
     */
    renderChildren(data: Values[], columns: LeafComponent[] | undefined): void;
}
/**
 * table renders tabular data, but does not allow any edits to the columns.
 * It can optionally have the facility to select a subset of rows.
 */
export interface TableEditorView extends BaseView {
    readonly comp: TableEditor;
    /**
     * remove all rendered rows.
     */
    reset(): void;
    /**
     * append on row to the view
     * @param fc form controller that manages this row
     * @param rowIdx 0-based row index with which the row is to be marked with
     * @param values optional initial values for the fields.
     * If not specified, the defaultValue, if specified for that field, will be used as the initial value for a field
     */
    appendRow(fc: FormController, rowIdx: number, values?: Values): void;
}
/**
 * tab group is the container for tabs
 */
export interface TabsView extends BaseView {
    readonly comp: Tabs;
    /**
     * set error status of a all tabs
     * @param errors must be of the right length for he tabs
     */
    setTabErrorStatus(errors: boolean[]): void;
}
export {};
