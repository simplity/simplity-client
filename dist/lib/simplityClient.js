"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simplityClient = void 0;
const logger_1 = require("./logger-stub/logger");
const appElement_1 = require("./html/appElement");
const app_1 = require("./controller/app");
exports.simplityClient = {
    /**
     * Simplity uses the console as the default device to log to.
     * a call to setLogger(0 would change to the supplied API.
     * getLogger() returns the one that was set last, or the default logger
     * @returns current logger
     */
    getLogger: () => {
        return logger_1.loggerStub.getLogger();
    },
    /**
     * change the device/API to which the logs are written.
     * undefined to silence/disable the logging process
     * @param logger
     * @returns
     */
    setLogger: (logger) => {
        if (logger) {
            logger_1.loggerStub.connectLogger(logger);
        }
        else {
            logger_1.loggerStub.swallowAll();
        }
        return;
    },
    startHtmlClient: (runtime, root) => {
        new appElement_1.AppElement(runtime, root);
        return app_1.app.getCurrentAc();
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltcGxpdHlDbGllbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGliL3NpbXBsaXR5Q2xpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLGlEQUFrRDtBQUNsRCxrREFBK0M7QUFDL0MsMENBQXVDO0FBRTFCLFFBQUEsY0FBYyxHQUFHO0lBQzVCOzs7OztPQUtHO0lBQ0gsU0FBUyxFQUFFLEdBQUcsRUFBRTtRQUNkLE9BQU8sbUJBQVUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUNoQyxDQUFDO0lBQ0Q7Ozs7O09BS0c7SUFDSCxTQUFTLEVBQUUsQ0FBQyxNQUEwQixFQUFFLEVBQUU7UUFDeEMsSUFBSSxNQUFNLEVBQUUsQ0FBQztZQUNYLG1CQUFVLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ25DLENBQUM7YUFBTSxDQUFDO1lBQ04sbUJBQVUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUMxQixDQUFDO1FBQ0QsT0FBTztJQUNULENBQUM7SUFDRCxlQUFlLEVBQUUsQ0FBQyxPQUFzQixFQUFFLElBQWlCLEVBQUUsRUFBRTtRQUM3RCxJQUFJLHVCQUFVLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzlCLE9BQU8sU0FBRyxDQUFDLFlBQVksRUFBRSxDQUFDO0lBQzVCLENBQUM7Q0FDRixDQUFDIn0=