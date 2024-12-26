import { ClientRuntime, AppController, Form, FunctionDetails, Layout, MenuItem, Page, ValueValidationResult, Values, Vo, NavigationAction, AppView, PanelView, Module, ServiceResponse, SimpleList, KeyedList, ValueType, FunctionType } from 'simplity-types';
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
    /**
     * prefix for all image names
     */
    private readonly imageBasePath;
    private readonly allMessages;
    private readonly loginServiceName;
    private readonly logoutServiceName;
    private readonly listSources;
    /**
     * session id as set by the server
     */
    private sessionId?;
    private readonly context;
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
     * all parameters are assumed to be valid.
     * No error handling for any possible invalid parameters
     */
    constructor(
    /**
     * meta-data components for this apps
     */
    runtime: ClientRuntime, 
    /**
     * This is the root html element for this app.
     */
    appView: AppView);
    private createValidationFns;
    newWindow(url: string): void;
    closePopup(): void;
    newError(msg: string): Error;
    navigate(action: NavigationAction): void;
    selectModule(name: string): void;
    getUserChoice(text: string, choices: string[]): Promise<number>;
    renderAsPopup(panel: PanelView): void;
    setPageTitle(title: string): void;
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
    serve(serviceName: string, data?: Vo): Promise<ServiceResponse>;
    downloadServiceResponse(fileName: string, serviceName: string, data: Vo | undefined): Promise<boolean>;
    getList(listName: string, forceRefresh: boolean, key?: number | string): Promise<SimpleList>;
    getKeyedList(listName: string, forceRefresh: boolean): Promise<KeyedList>;
    validateValue(schemaName: string, value: string): ValueValidationResult;
    validateType(valueType: ValueType, textValue: string): ValueValidationResult;
    atLeastOneAllowed(ids: string[]): boolean;
    setAccessControls(ids: string): void;
    /**
     * method to be called after login, if that is done by another component.
     * it is better to call login() of this service instead.
     */
    private afterLogin;
    private shouldExist;
}
