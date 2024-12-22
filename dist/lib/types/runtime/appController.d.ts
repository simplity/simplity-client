import { Values, Vo, Layout, MenuItem, Module, Page, Form, NavigationAction, PanelView, ServiceResponse, StringMap, FunctionDetails, ValueValidationResult, SimpleList, FunctionType, ValueType } from '..';
/**
 * App controller provides centralized services for all its components
 * This run-time component is built using all the app-components and scripts/functions of the app
 */
export interface AppController {
    /**
     * IMPORTANT:
     * optimized for run time. all get() methods throw exception if component asked for is not available.
     * this approach makes the error handling centralized at appController level
     * any code that wants to just try to see if a component is available must use try/catch blocks.
     *
     */
    /**
     * designed for internal use when the caller does expect the layout.
     * test/demo uses can catch the error to take suitable action on missing a layout
     * @param layoutName unique name of this layout.
     * @returns Layout.
     * @throws Error in case the layout does not exist
     */
    getLayout(layoutName: string): Layout;
    /**
     *
     * @param unique name.
     * @returns module if the logged-in user has access, undefined otherwise
     * @throws Error in case the module does not exist
     */
    getModuleIfAccessible(name: string): Module | undefined;
    /**
     *
     * @param unique name
     * @returns module if user has access, undefined otherwise
     * @throws Error if this module is not defined
     */
    getModule(name: string): Module;
    /**
     *
     * @param id unique id for this menu item
     * @returns menu detailed
     * @throws Error in case the menu does not exist
     */
    getMenu(id: string): MenuItem;
    /**
     *
     * @param id unique id for this menu item
     * @returns menu if the logged in user has access to this menu. undefined otherwise
     * @throws Error in case the menu does not exist
     */
    getMenuIfAccessible(id: string): MenuItem | undefined;
    /**
     *
     * @param pageName unique name of this page.
     * @returns page
     * @throws error in case such a page is not defined in this app
     */
    getPage(pageName: string): Page;
    /**
     * get a component that is custom-designed for this app.
     * designed for production where we do expect the component to be defined.
     * test/demo usage must catch the error to take suitable action
     * Note: caller must cast it to the right type to use the type-features of TS
     * @param name
     * @returns custom component
     * @throws error in case such a component is not defined.
     */
    /**
     *
     * @param formName unique name of this form.
     * @returns Form
     * @throws error in case the form is missing
     */
    getForm(formName: string): Form;
    /**
     *
     * @param functionName
     * @param type optional. If specified, the named-function is returned only if it has the specified scope.
     * @returns a function entry for this function.
     * @throws Error if such a function is not available, or if the function is not of the desired type
     */
    getFn(functionName: string, type?: FunctionType): FunctionDetails;
    /**
     * get the src (url) for an image. returned value is suitable to set src="" of an <img> tag
     * @param imageName
     * @returns url if available. returns the name itself if the src is not available. this behavior is different from other getters
     */
    getImageSrc(imageName: string): string;
    /**
     * This is the core design feature using which the actual HTML is separated from the framework to the app implementation
     * App designers have to ensure that the HTML follows all the conventions for the intended component.
     * e.g. html for an input text field must have the data-* attributes required to identify error element etc..
     * @param htmlName unique name used by the app to identify this html
     * @returns html text, or empty string (NOT undefined) if the named HTML is not made available to the controller
     */
    getHtml(htmlName: string): string;
    /**
     * get the gridStyle for the named style, or the default style
     * @param name named style ir undefined to get the default style
     */
    /**
     * get text for a message id
     * @param id
     * @param params run-time parameters, if this message is parameterized
     * @returns id if no message is available for this id
     */
    getMessage(id: string, params?: string[]): string;
    /**
     * @returns the array of permitted screens for a user.
     *  empty array if a session is not active, or the logged in user has access to none
     */
    getPermittedPages(): Array<string>;
    /**
     * any data that  is to be saved as part of session.
     * This will survive reloads, but not browser closure
     *
     * @param key
     * @param value
     */
    setContextValue(key: string, value: any): void;
    /**
     * remove this entry
     * @param key
     */
    removeContextValue(key: string): void;
    /**
     * clear all context storage entries
     */
    clearContext(): void;
    /**
     * value of a field that is session scoped
     * @param key
     * @returns context-scoped value for this ke. undefined if such key is found
     */
    getContextValue(key: string): any;
    /**
     * @returns details of logged-in user. undefined if a user-session is not active
     */
    getUser(): Vo | undefined;
    /**
     * login with credentials (like login id and password).
     * App Controller handles all necessary actions required on success of login, including creating creating user-context etc..
     * Caller needs to show errors in case of failure, and navigation to home page on success
     * @param credentials
     * @returns true if login succeeded, false if the login is unsuccessful with the credentials, or for any errors encountered
     */
    login(credentials: Values): Promise<boolean>;
    /**
     * log the user out of this this session. This is more of a background task, and the caller is unlikely to be interested in the actual result
     * User context if any, is removed before making the service call to the server.
     * So, even if the call to the server fails, the user is logged-out from the  client-app, and requires a fresh login to access any secure service
     *
     */
    logout(): void;
    /**
     * get the response for this service as a Promise.
     * Caller need not handle exceptions as exceptions if any are reported as part of Service Response.
     *
     * @param serviceName name of the service to be requested
     * @param data optional input data that accompanies the request.
     * @returns promise that can get the response for this service request
     */
    serve(serviceName: string, data?: Vo): Promise<ServiceResponse>;
    /**
     * download the response from a service
     * @param fileName
     * @param serviceName service name whose response is to be downloaded
     * @param data input data for this service
     * @returns a Promise that must be then()/await() ed even if the caller is not interested in using the promised value.
     *
     */
    downloadServiceResponse(fileName: string, serviceName: string, data?: Vo): Promise<boolean>;
    /**
     *
     * get a list (of value-text pairs) that is suitable for rendering drop-downs
     * An empty list is returned in case of any error, after handling the error in an appropriate manner.
     * Hence the caller may just use the returned list, without any error-handling.
     * @param listName
     * @param forceRefresh if true, for a runtime list, any locally cached list from a previous fetch is discarded.
     * @param key
     * @returns Promise that gets you the required list
     */
    getList(listName: string, forceRefresh: boolean, key?: string | number | undefined): Promise<SimpleList>;
    /**
     * get a collection (object) all the keys with the associated list (of value-text pairs)
     
     * An empty object is returned in case of any error, after handling the error in an appropriate manner.
     * Hence the caller may just use the returned list, without any error-handling.
     * @param listName
     * @param forceRefresh if true, for a runtime list, any locally cached list from a previous fetch is discarded.
     * @returns Promise that gets you the required lists
     */
    getKeyedList(listName: string, forceRefresh: boolean): Promise<StringMap<SimpleList>>;
    /**
     * is the named page valid?
     * @param page
     * @returns true if the page is valid. False if the page does not exist, or is invalid
     */
    isPageValid(page: string): boolean;
    /**
     * validate the value as per the schema.
     * Should be called only if the value is "entered".
     * Typically, value-schema assumes that the "required" condition is checked before this invocation.
     * @param schemaName
     * @param value should be non-empty
     */
    validateValue(schemaName: string, value: string): ValueValidationResult;
    /**
     * validate the text value for the specified value type.
     * to be used for values which do not need to be validated further, once it is of the right type.
     * for e.g. '123' is a valid number but 'abc' is not
     * @param valueType
     * @param textValue
     */
    validateType(valueType: ValueType, textValue: string): ValueValidationResult;
    /**
     * designed specifically for a module. Returns true if at least one of the menu-items in a module is allowed
     * @param ids
     */
    atLeastOneAllowed(ids: string[]): boolean;
    /**
     *
     * @param ids comma separated list of menu ids that the logged-in user has access to.
     * '*' to allow all
     */
    setAccessControls(ids: string): void;
    /**
     * navigate to a page based on layout/module/menu
     * @param page to navigate to
     */
    navigate(action: NavigationAction): void;
    /**
     * open a new window for an external URL
     */
    newWindow(url: string): void;
    /**
     * called when user has clicked on a module icon
     */
    selectModule(name: string): void;
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
     * returns an error to be thrown. Takes care of logging/reporting this error before returning the Error object
     * @param msg error message
     */
    newError(msg: string): Error;
    /**
     * It is possible that a layout shows the page title outside of the page area.
     * this method is to be called to set the title. Note that this is NOT the title of the window
     * @param title
     */
    setPageTitle(title: string): void;
    /**
     * Show a message/question to get user's response/choice
     * @param text message text to be shown
     * @param choices options to be shown as buttons to choose from
     * @returns Promise to get the 0-based index to the choices the user has made. -1 if the user has cancelled the operation
     */
    getUserChoice(text: string, choices: string[]): Promise<number>;
}
