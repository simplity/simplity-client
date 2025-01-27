import { ClientRuntime, AppController, Form, FunctionDetails, Layout, MenuItem, Page, ValueValidationResult, Values, Vo, AppView, PanelView, Module, ServiceResponse, SimpleList, KeyedList, ValueType, FunctionType, FormController, PageController, NavigationOptions, Alert } from 'simplity-types';
export declare class AC implements AppController {
    /**
     * This is the root html element for this app.
     */
    private readonly appView;
    private readonly allForms;
    private readonly allPages;
    private readonly functionDetails;
    private readonly validationFns;
    private readonly allHtmls;
    private readonly allModules;
    private readonly allMenus;
    private readonly allLayouts;
    private readonly listSources;
    private readonly allMessages;
    private readonly loginServiceName;
    private readonly logoutServiceName;
    private readonly imageBasePath;
    private sessionId?;
    private readonly context;
    /**
     * access control related
     */
    private validPagesArray;
    private allowAllMenus;
    private allowedModules;
    private allowedMenus;
    /**
     * agent to communicate with the app-server for services
     * can be a dummy for testing/demo version
     */
    private readonly agent;
    /**
     * hooks for page/form level functions for the app-client layer
     */
    private readonly onPageLoadFn?;
    private readonly onFormRenderFn?;
    constructor(
    /**
     * meta-data components for this apps
     */
    runtime: ClientRuntime, 
    /**
     * This is the root html element for this app.
     */
    appView: AppView);
    pageLoaded(pc: PageController): void;
    formRendered(fc: FormController): void;
    private createValidationFns;
    newWindow(url: string): void;
    closePopup(): void;
    newError(msg: string): Error;
    /**
     * use has selected a menu item (outside of page buttons etc.. like from a menu)
     * @param menu
     */
    menuSelected(module: string, menuItem: string): void;
    /**
     * request coming from the controller side to navigate to another page
     * @param options
     */
    navigate(options: NavigationOptions): void;
    selectModule(name: string): void;
    getUserChoice(text: string, choices: string[]): Promise<number>;
    renderAsPopup(panel: PanelView): void;
    setPageTitle(title: string): void;
    disableUx(): void;
    enableUx(): void;
    showAlerts(alerts: Alert[]): void;
    isPageValid(page: string): boolean;
    getLayout(nam: string): Layout;
    getModule(nam: string): Module;
    getMenu(nam: string): MenuItem;
    getModuleIfAccessible(nam: string): Module | undefined;
    getMenuIfAccessible(nam: string): MenuItem | undefined;
    getPage(nam: string): Page;
    getForm(nam: string): Form;
    getFn(nam: string, type?: FunctionType): FunctionDetails;
    getImageSrc(imageName: string): string;
    getHtml(htmlName: string): string;
    getMessage(id: string, params?: string[] | undefined): string;
    getPermittedPages(): string[];
    setContextValue(key: string, value: any): void;
    removeContextValue(key: string): void;
    clearContext(): void;
    getContextValue(key: string): any;
    getUser(): Vo | undefined;
    login(credentials: Values): Promise<boolean>;
    logout(): void;
    atLeastOneAllowed(ids: string[]): boolean;
    setAccessControls(ids: string): void;
    serve(serviceName: string, data?: Vo, toDisableUx?: boolean): Promise<ServiceResponse>;
    downloadServiceResponse(fileName: string, serviceName: string, data: Vo | undefined): Promise<boolean>;
    getList(listName: string, forceRefresh: boolean, key?: number | string): Promise<SimpleList>;
    getKeyedList(listName: string, forceRefresh: boolean): Promise<KeyedList>;
    validateValue(schemaName: string, value: string): ValueValidationResult;
    validateType(valueType: ValueType, textValue: string): ValueValidationResult;
    /**
     * method to be called after login, if that is done by another component.
     * it is better to call login() of this service instead.
     */
    private afterLogin;
    private shouldExist;
}
