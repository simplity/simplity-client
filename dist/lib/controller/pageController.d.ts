import { FieldView, PageView, Value, Vo, Values, StringMap, PageController, AppController, FormController, DetailedMessage, FnStatus, Action, AnyValue, SimpleList, KeyedList, FormOperation, ServiceRequestOptions } from 'simplity-types';
export declare class PC implements PageController {
    readonly name: string;
    /**
     * controller for the root form.
     */
    readonly fc: FormController;
    readonly ac: AppController;
    /**
     * meta data for this page
     */
    private readonly page;
    /**
     * page class/component associated with this service
     */
    private readonly pageView;
    private readonly buttonsToDisplay;
    /**
     * is this page for saving data? (for add or update depending on the mode)
     */
    private forSave;
    /**
     * relevant if forSave is true.
     * true if the page is invoked with keys, and hence we are updating
     */
    private saveIsUpdate;
    /**
     * title of the page may have dynamic content (field) in that.
     * this field has the calculated string, based on current values
     */
    private currentTitle;
    /**
     * set to true if user changes any field value
     */
    private isModified;
    /**
     * values that are set at run time at the page-context.
     * this context is checked for preparing the payload using params.
     */
    private values;
    /**
     * runtime actions are triggered by view components that may be created at run time, needing onclick-action.
     */
    private readonly functions;
    private readonly actions;
    private readonly lists;
    constructor(pageView: PageView);
    pageRendered(): void;
    pageLoaded(): void;
    getFormController(): FormController;
    setVariable(name: string, value: AnyValue | Vo): void;
    getVariable(name: string): AnyValue | Vo | undefined;
    setModifiedStatus(isModified: boolean): void;
    isValid(): boolean;
    /**
     *
     * @param messages
     */
    showMessages(messages: DetailedMessage[]): void;
    getList(control: FieldView, key?: string | number | undefined): void;
    getServiceName(formName: string | undefined, operation: FormOperation, messages: DetailedMessage[]): string;
    requestService(serviceName: string, options?: ServiceRequestOptions): void;
    /**
     * to be called by a run-time app-specific function.
     * This feature is designed to cater to a situation where the details of an action can not be specified at design time.
     * @param action
     * @param controller defaults to the root form controller.
     * A child-form-controller may be passed in case some field values are to be taken from that form as part of this action.
     * @param params
     */
    takeAction(action: Action, controller?: FormController, additionalParams?: StringMap<any>): void;
    act(actionName: string, controller?: FormController, additionalParams?: StringMap<any>): void;
    addList(name: string, list: SimpleList | KeyedList): void;
    addFunction(name: string, fn: () => unknown): void;
    getFieldValue(qualifiedName: string): Value | undefined;
    callFunction(name: string, params?: StringMap<any>, msgs?: DetailedMessage[], controller?: FormController): FnStatus;
    private setButtonDisplays;
    private checkTitle;
    private serve;
    /**
     * IMP: code within this class must call this, and not the public method
     * actions can be chained with onSuccess and inFailure.
     * This may lead to infinite loops.
     * This is designed to detect any such loop and throw error, rather than getting a activeActions-over-flow
     */
    private doAct;
    /**
     *
     * @param name may be of the form ${run-time-name}
     */
    private getAction;
    setDisplayState(compName: string, settings: Values): void;
    /**
     * an async action has returned. We have to continue the possible action-chain
     * @param action
     * @param ok //if the action succeeded
     * @param activeActions
     */
    private actionReturned;
    private navigate;
    private doFormAction;
    private getFilterData;
}
