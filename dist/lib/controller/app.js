"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const pageController_1 = require("./pageController");
const logger_1 = require("../loggerStub/logger");
const appController_1 = require("./appController");
const util_1 = require("./util");
let logger = logger_1.loggerStub.getLogger();
let pc;
let ac;
/**
 * utility to create controllers
 */
exports.app = {
    /**
     * constants/conventions that are used across layers.
     * These are fixed at design time. deployment-time parameters can be found in Config
     */
    Conventions: {
        messageIds: {
            /**
             * value is required
             */
            valueIsRequired: '_valueRequired',
            /**
             * generic error message when validation fails and  no specific error id is specified
             */
            invalidValue: '_invalidValue',
            /**
             * error when the specified schema is not defined in the app
             */
            schemaIsMissing: '_schemaIsMissing',
        },
        /**
         * name of the style in gridStyles collection that is to be used as a default style
         */
        defaultGridStyle: '_defaultStyle',
        /**
         * special pre-defined service to get drop-down values
         */
        listServiceName: '_getList',
        /**
         * special pre-defined service to get a report
         */
        reportServiceName: '_getReportSettings',
        /**
         * user attribute that has the list of allowed menu ids
         */
        allowedMenuIds: 'allowedMenuIds',
    },
    /**
     * create an App Controller.
     * This instance is the return-value for subsequent calls to getController()
  
     * @param runtime
     * @param appView
     * @returns
     */
    newAc: (runtime, appView) => {
        if (ac) {
            logger.warn(`The controller for app ${runtime.name} exists, but a new one being created. This is an ERROR in production mode`);
        }
        ac = new appController_1.AC(runtime, appView);
        return ac;
    },
    /**
     * To be invoked ONLY after createNew() is invoked. An error is thrown otherwise.
     * @returns current active instance
     * @throws error if no instance is created
     */
    getCurrentAc: () => {
        if (!ac) {
            throw new Error('Controller is being requested before instantiating it');
        }
        return ac;
    },
    /**
     * create the controller for this page and save it for subsequent calls to getCurrentPageController()
     * @param view page view component
     * @returns
     */
    newPc: (view) => {
        pc = new pageController_1.PC(view);
        return pc;
    },
    /**
     *
     * @returns the last created controller.
     * @throws error is no controller was created
     */
    getCurrentPc: () => {
        if (pc) {
            return pc;
        }
        const msg = 'request received to get the current page controller, but none is created yet.';
        logger.error(msg);
        throw new Error(msg);
    },
    util: util_1.util,
};
//# sourceMappingURL=app.js.map