import { ClientRuntime, AppController, Form, FunctionDetails, Layout, MenuItem, Page, ValueValidationResult, Values, Vo, AppView, PanelView, Module, ServiceResponse, SimpleList, KeyedList, ValueType, FunctionType, ValueSchema, NavigationOptions, Alert, BaseView, PageComponent, FormController, Value } from 'simplity-types';
export declare class AC implements AppController {
    private readonly appView;
    private readonly allForms;
    private readonly allPages;
    private readonly functionDetails;
    private readonly validationFns;
    private readonly allHtmls;
    private readonly allModules;
    private readonly allMenus;
    private readonly allLayouts;
    private readonly allValueSchemas;
    private readonly listSources;
    private readonly allMessages;
    private readonly loginServiceName;
    private readonly logoutServiceName;
    private readonly imageBasePath;
    private readonly viewFActory?;
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
     * fragile design to manage multiple requests to disable/enable involving async calls
     * is enabled when 0.
     * TODO: when a function throws error after disabling!!!
     */
    private disableUxCount;
    /**
     * @param runtime meta-data components for this apps
     * @param appView  This is the root html element for this app.
     */
    constructor(runtime: ClientRuntime, appView: AppView);
    private createValidationFns;
    newWindow(url: string): void;
    closePopup(): void;
    newError(msg: string): Error;
    /**
     * use has selected a menu item (outside of page buttons etc.. like from a menu)
     * @param menu
     */
    menuSelected(module: string, menuItem: string): void;
    closePage(): void;
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
    enableUx(force?: boolean): void;
    showAlerts(alerts: Alert[]): void;
    isPageValid(page: string): boolean;
    getLayout(nam: string): Layout;
    getModule(nam: string): Module;
    getMenu(nam: string): MenuItem;
    getValueSchema(nam: string): ValueSchema;
    getModuleIfAccessible(nam: string): Module | undefined;
    getMenuIfAccessible(nam: string): MenuItem | undefined;
    getPage(nam: string): Page;
    getForm(nam: string): Form;
    getFn(nam: string, type?: FunctionType): FunctionDetails;
    newPluginComponent(fc: FormController | undefined, comp: PageComponent, maxWidth: number, value?: Value): BaseView;
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
    serve(serviceName: string, data?: Vo): Promise<ServiceResponse>;
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
