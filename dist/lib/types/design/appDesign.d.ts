import { StringMap, Layout, MenuItem, Module, Page, ServiceResponse, ServiceSpec, Sql, PageTemplate, ValueSchema, PageAlteration, Form, ListSource, FunctionType } from '..';
export type AppDetails = {
    name: string;
    version: string;
    date: string;
    description: string;
    /**
     * default max length to be used for a text-value-schema with no max specified
     */
    maxLengthForTextField: number;
    /**
     * if this app is an multi-tenant app.
     */
    tenantFieldName?: string;
    /**
     * column name in db tables for the tenant column
     */
    tenantNameInDb?: string;
    /**
     * simplity agent manages login process, if it is configured at the app level.
     * this service, if specified, has to conform to the login-specific API
     */
    loginServiceName?: string;
    /**
     * simplity agent invokes the logout service, but does not expect any response back.
     */
    logoutServiceName?: string;
    /**
     * server-side. Used for generating java classes
     */
    javaRootPackageName?: string;
    /**
     * URL for the server. All requests are sent to this url.
     * Only local resources are used if the url is not set
     */
    serverUrl?: string;
    /**
     * e.g. ./assets/images/
     */
    imageBasePath: string;
    /**
     * layout to render on load
     */
    startingLayout: string;
    /**
     * module to be selected by default on loading
     */
    startingModule: string;
    /**
     *  app-specific
     */
    appParams?: {
        [key: string]: any;
    };
};
export type AppDesign = {
    appDetails: AppDetails;
    /**
     * ready responses are cached responses by serviceNames,  by the client.
     * we may also decide to shift them to the server side on a need basis.
     * this feature is useful during development and for demo purposes
     * if a ready response is available, the response is used instead of calling a service
     */
    cachedResponses?: StringMap<ServiceResponse>;
    /**
     * forms that are generated from records
     */
    forms?: StringMap<Form>;
    /**
     * all functions defined for this app. Note that the function name has to be unique across all pages.
     * an App may follow naming convention like pageName.functionName if the app is quite large
     */
    functions?: StringMap<FunctionType>;
    /**
     * how the visual components are laid out on the canvas
     */
    layouts?: StringMap<Layout>;
    listSources?: StringMap<ListSource>;
    menuItems?: StringMap<MenuItem>;
    messages?: StringMap<string>;
    modules?: StringMap<Module>;
    pageAlterations?: StringMap<PageAlteration>;
    pages?: StringMap<Page>;
    serviceSpecs?: StringMap<ServiceSpec>;
    sqls?: StringMap<Sql>;
    templates?: StringMap<PageTemplate>;
    valueSchemas?: StringMap<ValueSchema>;
};
