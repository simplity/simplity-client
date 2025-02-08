"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const simplity_types_1 = require("simplity-types");
const pageController_1 = require("./pageController");
const logger_1 = require("../logger-stub/logger");
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
        /**
         * value is required
         */
        errorValueIsRequired: simplity_types_1.systemResources.messages._valueRequired,
        /**
         * generic error message when validation fails and  no specific error id is specified
         */
        errorInvalidValue: simplity_types_1.systemResources.messages._invalidValue,
        /**
         * general error message when reg-ex fails, and the value schema does not provide specific error
         */
        errorSchemaIsMissing: simplity_types_1.systemResources.messages._missingSchema,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9jb250cm9sbGVyL2FwcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtREFPd0I7QUFDeEIscURBQXNDO0FBQ3RDLGtEQUFtRDtBQUNuRCxtREFBcUM7QUFDckMsaUNBQThCO0FBRTlCLElBQUksTUFBTSxHQUFHLG1CQUFVLENBQUMsU0FBUyxFQUFFLENBQUM7QUFFcEMsSUFBSSxFQUFrQixDQUFDO0FBQ3ZCLElBQUksRUFBaUIsQ0FBQztBQUV0Qjs7R0FFRztBQUNVLFFBQUEsR0FBRyxHQUFHO0lBQ2pCOzs7T0FHRztJQUNILFdBQVcsRUFBRTtRQUNYOztXQUVHO1FBQ0gsZ0JBQWdCLEVBQUUsZUFBZTtRQUNqQzs7V0FFRztRQUNILGVBQWUsRUFBRSxVQUFVO1FBRTNCOztXQUVHO1FBQ0gsaUJBQWlCLEVBQUUsb0JBQW9CO1FBQ3ZDOztXQUVHO1FBQ0gsY0FBYyxFQUFFLGdCQUFnQjtRQUNoQzs7V0FFRztRQUNILG9CQUFvQixFQUFFLGdDQUFlLENBQUMsUUFBUSxDQUFDLGNBQWM7UUFDN0Q7O1dBRUc7UUFDSCxpQkFBaUIsRUFBRSxnQ0FBZSxDQUFDLFFBQVEsQ0FBQyxhQUFhO1FBQ3pEOztXQUVHO1FBQ0gsb0JBQW9CLEVBQUUsZ0NBQWUsQ0FBQyxRQUFRLENBQUMsY0FBYztLQUM5RDtJQUVEOzs7Ozs7O09BT0c7SUFDSCxLQUFLLEVBQUUsQ0FBQyxPQUFzQixFQUFFLE9BQWdCLEVBQUUsRUFBRTtRQUNsRCxJQUFJLEVBQUUsRUFBRSxDQUFDO1lBQ1AsTUFBTSxDQUFDLElBQUksQ0FDVCwwQkFBMEIsT0FBTyxDQUFDLElBQUksMkVBQTJFLENBQ2xILENBQUM7UUFDSixDQUFDO1FBRUQsRUFBRSxHQUFHLElBQUksa0JBQUUsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDOUIsT0FBTyxFQUFFLENBQUM7SUFDWixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILFlBQVksRUFBRSxHQUFHLEVBQUU7UUFDakIsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ1IsTUFBTSxJQUFJLEtBQUssQ0FBQyx1REFBdUQsQ0FBQyxDQUFDO1FBQzNFLENBQUM7UUFFRCxPQUFPLEVBQUUsQ0FBQztJQUNaLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsS0FBSyxFQUFFLENBQUMsSUFBYyxFQUFrQixFQUFFO1FBQ3hDLEVBQUUsR0FBRyxJQUFJLG1CQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbEIsT0FBTyxFQUFFLENBQUM7SUFDWixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILFlBQVksRUFBRSxHQUFtQixFQUFFO1FBQ2pDLElBQUksRUFBRSxFQUFFLENBQUM7WUFDUCxPQUFPLEVBQUUsQ0FBQztRQUNaLENBQUM7UUFDRCxNQUFNLEdBQUcsR0FDUCwrRUFBK0UsQ0FBQztRQUNsRixNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2xCLE1BQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDdkIsQ0FBQztJQUNELElBQUksRUFBRSxXQUFJO0NBQ1gsQ0FBQyJ9