import { AppController, BaseView, ChartController, DataController, DetailedMessage, EventDetails, EventHandler, EventName, Form, FormController, PageController, StringMap, TableEditorController, TableEditorView, TableViewerController, TableViewerView, Value, Values, Vo } from 'simplity-types';
/**
 * controls a row in a table or the root fields in a page.
 */
export declare class FC implements FormController {
    readonly name: string;
    readonly pc: PageController;
    private readonly form?;
    readonly ac: AppController;
    readonly type = "form";
    private controllers;
    /**
     * all fields in this form.
     */
    private readonly fieldViews;
    /**
     * this is THE MODEL that this controller should control
     */
    private data;
    /**
     * all the registered children
     */
    private readonly children;
    private readonly listeners;
    /**
     * set to true whenever a child reports a data-change
     */
    private gotModified;
    /**
     * editable fields within tab-children of tabs panel.
     * For each tabs panel, for each tab-child of that tabs, we have an array of editable fields.
     * populated if the tabs panel is marked as trackErrors
     */
    private tabGroups?;
    /**
     * array that would contain one entry for each child-tab. (Each entry would be again an array)
     * This is used during registration process.
     */
    private currentGroupArray?;
    /**
     * current tab that is open to which any editable field is to be added to.
     * This is used during registration process.
     *
     * registerFields() would push editable fields into this array
     */
    private currentTabArray?;
    /**
     * @param name unique across all elements of the parent. anything if this has no parent.
     * @param pc
     * @param form optional. form-based feature are available only if the form is not undefined
     * @param data optional. initial data with which the fields are to be rendered with
     */
    constructor(name: string, pc: PageController, form?: Form | undefined, data?: Vo);
    getFormName(): string | undefined;
    registerChild(view: BaseView): void;
    /**
     * tabbed  panel  has  individual
     * @param panelName
     */
    private beginTabGroup;
    /**
     *
     * @param panelName starting a new tab within tabs.
     * Get ready to receive fields into this tab.
     * @param comp
     */
    private beginTab;
    endOfTab(): void;
    endOfTabGroup(): void;
    formRendered(): void;
    getChildren(): StringMap<BaseView>;
    newTableViewerController(view: TableViewerView): TableViewerController;
    newTableEditorController(view: TableEditorView): TableEditorController;
    newFormController(name: string, form?: Form, data?: Vo): FormController;
    newChartController(view: BaseView): ChartController;
    getController(name: string): DataController | undefined;
    addEventListener(viewName: string, eventName: EventName, eventFn: EventHandler): void;
    receiveData(vo: Vo | Vo[], childName?: string): void;
    setData(data: Vo): void;
    getData(names?: string[]): Vo;
    extractData(params: StringMap<boolean>, messages: DetailedMessage[]): Vo | undefined;
    extractKeys(messages: DetailedMessage[]): Values | undefined;
    resetData(fields?: string[]): void;
    private setValueToChild;
    setFieldValue(fieldName: string, value: Value): void;
    getFieldValue(fieldName: string): Value | undefined;
    getChild(name: string): BaseView | undefined;
    isValid(): boolean;
    isModified(): boolean;
    validate(): boolean;
    setModifiedStatus(isModified: boolean): void;
    hasKeyValues(): boolean;
    valueHasChanged(fieldName: string, newValue: Value): void;
    valueIsChanging(_fieldName: string, _newValue: Value, _newValidity?: boolean): void;
    setDisplayState(compName: string, settings: Values): boolean;
    eventOccurred(evt: EventDetails): void;
    act(actionName: string, params?: StringMap<any>): void;
    private reportFieldErrors;
    private isInterFieldValid;
    private checkName;
}
