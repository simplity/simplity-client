import { AppController, AppView, PageController, PageView, AppRuntime } from 'simplity-types';
/**
 * utility to create controllers
 */
export declare const app: {
    /**
     * constants/conventions that are used across layers.
     * These are fixed at design time. deployment-time parameters can be found in Config
     */
    Conventions: {
        /**
         * name of the style in gridStyles collection that is to be used as a default style
         */
        defaultGridStyle: string;
        /**
         * special pre-defined service to get drop-down values
         */
        listServiceName: string;
        /**
         * special pre-defined service to get drop-down values
         */
        reportServiceName: string;
        /**
         * user attribute that has the list of allowed menu ids
         */
        allowedMenuIds: string;
        /**
         * value is required
         */
        errorValueIsRequired: "A value is required";
        /**
         * generic error message when validation fails and  no specific error id is specified
         */
        errorInvalidValue: "This value is not valid";
        /**
         * general error message when reg-ex fails, and the value schema does not provide specific error
         */
        errorSchemaIsMissing: "Unable to validate this field because a value schema by name ${1} is missing";
    };
    /**
     * create an App Controller.
     * This instance is the return-value for subsequent calls to getController()
  
     * @param appRuntime
     * @param appView
     * @returns
     */
    newAc: (appRuntime: AppRuntime, appView: AppView) => AppController;
    /**
     * To be invoked ONLY after createNew() is invoked. An error is thrown otherwise.
     * @returns current active instance
     * @throws error if no instance is created
     */
    getCurrentAc: () => AppController;
    /**
     * create the controller for this page and save it for subsequent calls to getCurrentPageController()
     * @param view page view component
     * @returns
     */
    newPc: (view: PageView) => PageController;
    /**
     *
     * @returns the last created controller.
     * @throws error is no controller was created
     */
    getCurrentPc: () => PageController;
    util: {
        getEffectiveStyle(defaultStyle: string | undefined, userSpecified: string | undefined): string;
        download(data: import("simplity-types").Vo, fileName: string): void;
    };
};
