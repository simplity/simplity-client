import { Service, AlertType, StringMap, Value, AppController, Layout, MenuItem, Module, KeyedList, SimpleList, ValueList, Page, FormController, PageController, DetailedMessage, ServiceResponse, Form, Vo, Markups, Values } from '..';
export type RuntimeApp = {
    name: string;
    /**
     * default max length to be used for a text-value-schema with no max specified
     */
    maxLengthForTextField: number;
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
     * ready responses are cached responses by serviceNames.
     * this feature is useful during development and for demo purposes
     * if a ready response is available, the response is used instead of calling a service
     */
    cachedResponses?: StringMap<ServiceResponse>;
    /**
     * forms have the details to manage the UX to render and receive data from the users
     */
    forms?: StringMap<Form>;
    /**
     * functions with specs and actual implementations
     */
    functionDetails?: StringMap<FunctionDetails>;
    /**
     * all the html source/text for the view components
     */
    htmls?: StringMap<string>;
    /**
     * how the visual components are laid out on the canvas.
     * layout is a design component that is used as it is at run time
     */
    layouts?: StringMap<Layout>;
    /**
     * should no tbe considered as definitive. Any missing source should be considered as "run-time"
     */
    listSources?: StringMap<ListSource>;
    /**
     * local lists are cached responses to getList(). Useful during development/demo
     * this is a run-time concept to override a design component at run time
     */
    localLists?: StringMap<ValueList>;
    /**
     * local services are used during development as stubs.
     * a service  that is meant to be served by the server is over-ridden to be served locally on the client instead
     */
    localServices?: StringMap<Service>;
    /**
     * menu items are design components used at runtime as well
     */
    menuItems?: StringMap<MenuItem>;
    /**
     * possibly translated for the local language??
     */
    messages?: StringMap<string>;
    /**
     * modules are design components that are used  at runtime as well
     */
    modules?: StringMap<Module>;
    /**
     * pages are design components that are used at runtime as well
     */
    pages?: StringMap<Page>;
    /**
     * validation functions are primarily derived from value-schema
     */
    validationFns?: StringMap<ValueValidationFn>;
    /**
     * app-specific parameters. App should define a type for this for making it type-safe
     */
    appParams?: {
        [key: string]: any;
    };
};
/**
 * A global function that is accessible at the app level.
 *
 * @param ac: the app controller
 * @param params: additional parameters passed to the function
 * @param msgs array to which the function can add messages that may be passed on to the UX
 * @returns any. In some situations the return value may also be checked for truthy/falsy to trigger events like onsuccess etc..
 */
export type GlobalFunction = (ac: AppController, params: unknown, msgs: DetailedMessage[]) => unknown;
/**
 * A function that is to be triggered on some event. This is executed with page as the context.
 *
 * @param pc: the page controller used by this page
 * @param params: optional parameters for this function. If used, this is typically an object with name-value pairs.
 * onChange and OnChanging event call-back functions receive an object with {fieldName, value, event} attributes
 * @param msgs array to which the function can add messages that may be passed on to the UX
 * @returns any. In some situations the return value may also be checked for truthy/falsy to trigger evens like onsuccess etc..
 */
export type PageFunction = (pc: PageController, params: unknown, msgs: DetailedMessage[]) => unknown;
/**
 * a function that is triggered on events like
 * onChanged, onChanging, onValueChanged etc..
 * This is executed with form as the context. function can access only the form controller
 * (In case the function requires access to page level context, use page)
 * @param fc controller for this field
 * @param params   onChange and OnChanging event call-back functions receive an object with {fieldName, value, event} attributes
 * @param msgs array to which the function can add messages that may be passed on to the UX
 * @returns any. In some situations the return value may also be checked for truthy/falsy to trigger evens like onsuccess etc..
 */
export type FormFunction = (fc: FormController, param: unknown, msgs: DetailedMessage[]) => unknown;
/**
 * a function that is triggered just before requesting a service using a ServiceAction.
 * This is an intercept function that can either modify the payload for the request, or abort the request with an error message.
 * @param fc controller of the form being submitted. Note that the PageController is accessible from this.
 * @param payload that accompanies the request.
 * @param msgs array to which the function should add messages in case the request is to be aborted
 * @returns true to say OK for the request. false to abort the request.
 */
export type RequestFunction = (fc: FormController, payload: Vo | undefined, msgs: DetailedMessage[]) => boolean;
/**
 * An intercept function that is triggered after the response is received for an ServiceAction,
 * but before the serviceResponse is processed by the controller.
 * @param pc page controller
 * @param response serviceResponse that may be modified by this function
 */
export type ResponseFunction = (pc: PageController, response: ServiceResponse) => void;
/**
 * A form validation functions returns an array of messages in case of validation errors, or undefined if there are no errors
 */
export type FormValidationFunction = (fc: FormController) => [{
    fieldName: string;
    message: string;
}] | undefined;
/**
 * function to format the value for output.
 * It can also set the mark-up attributes for the view-element
 * @param value
 */
export type FormatterFunction = (value: Value, row: Values) => {
    value: string;
    markups: Markups;
};
export type FunctionDetails = {
    type: 'global';
    fn: GlobalFunction;
} | {
    type: 'request';
    fn: RequestFunction;
} | {
    type: 'response';
    fn: ResponseFunction;
} | {
    type: 'page';
    fn: PageFunction;
} | {
    type: 'form';
    fn: FormFunction | FormValidationFunction;
} | {
    type: 'value';
    fn: ValueValidationFn;
} | {
    type: 'format';
    fn: FormatterFunction;
};
/**
 * status returned by the controller when a function is requested at run time
 */
export type FnStatus = {
    /**
     * true if the function was called with success, false in case of any error, like function not defined, or the function threw an exception
     */
    allOk: boolean;
    /**
     * value returned by the function, if it got executed successfully
     */
    returnedValue?: unknown;
};
export type AppError = {
    error: string;
};
/**
 * Error object emitted by a value-schema validator
 */
export type SchemaError = {
    name: string;
    params?: string[];
};
/**
 * function that validates the supplied value, after parsing itq.
 */
export type ValueValidationFn = (
/** non-empty */ value: string) => ValueValidationResult;
/**
 * data-structure returned by a validation function.
 * value is undefined if the string could not be parsed into the right type
 */
export type ValueValidationResult = {
    /**
     * NULL_VALUE (and not undefined) if the parsing fails. (refer to getNullValue() method))
     * parsed value of the right type, if parsing is successful, even of the validation fails.
     * IMP: should check for messages to know if this value is valid or not.
     */
    value?: Value;
    /**
     * undefined if the value is valid.
     * at least one message in the array if the validation fails. (never empty array).
     * multiple messages possible if the field has multiple validation rules
     */
    messages: ValidationMessage[];
} | {
    value: Value;
    messages?: ValidationMessage[];
};
export type ValidationMessage = {
    /**
     * messages are externalized. run-time environment would get the actual text for this in the desired language
     */
    messageId: string;
    alertType: AlertType;
    /**
     * number of parameters should match the parameters embedded in the message
     */
    params?: string[];
};
/**
 * defines how the options for a named list is to be sourced at run time.
 */
export type ListSource = {
    name: string;
    okToCache: boolean;
    isKeyed: boolean;
    isRuntime: boolean;
    /**
     * relevant if this is not keyed
     * provided at design time, or cached if allowed
     */
    list?: SimpleList;
    /**
     * relevant if this is keyed
     * provided at design time, or cached if allowed
     */
    keyedList?: KeyedList;
};
