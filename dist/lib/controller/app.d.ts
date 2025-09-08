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
        messageIds: {
            /**
             * value is required
             */
            valueIsRequired: string;
            /**
             * generic error message when validation fails and  no specific error id is specified
             */
            invalidValue: string;
            /**
             * error when the specified schema is not defined in the app
             */
            schemaIsMissing: string;
        };
        /**
         * name of the style in gridStyles collection that is to be used as a default style
         */
        defaultGridStyle: string;
        /**
         * special pre-defined service to get drop-down values
         */
        listServiceName: string;
        /**
         * special pre-defined service to get a report
         */
        reportServiceName: string;
        /**
         * user attribute that has the list of allowed menu ids
         */
        allowedMenuIds: string;
    };
    /**
     * create an App Controller.
     * This instance is the return-value for subsequent calls to getController()
  
     * @param runtime
     * @param appView
     * @returns
     */
    newAc: (runtime: AppRuntime, appView: AppView) => AppController;
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
