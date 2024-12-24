"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simplityClient = void 0;
const app_1 = require("./lib/controller/app");
const appElement_1 = require("./lib/html/appElement");
const logger_1 = require("./lib/logger-stub/logger");
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
    startHtmlClient: (runtimeApp, root) => {
        const appEle = new appElement_1.AppElement(runtimeApp, root);
        return app_1.app.newAc(runtimeApp, appEle);
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsOENBQTJDO0FBQzNDLHNEQUFtRDtBQUNuRCxxREFBc0Q7QUFFekMsUUFBQSxjQUFjLEdBQUc7SUFDNUI7Ozs7O09BS0c7SUFDSCxTQUFTLEVBQUUsR0FBRyxFQUFFO1FBQ2QsT0FBTyxtQkFBVSxDQUFDLFNBQVMsRUFBRSxDQUFDO0lBQ2hDLENBQUM7SUFDRDs7Ozs7T0FLRztJQUNILFNBQVMsRUFBRSxDQUFDLE1BQTBCLEVBQUUsRUFBRTtRQUN4QyxJQUFJLE1BQU0sRUFBRSxDQUFDO1lBQ1gsbUJBQVUsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbkMsQ0FBQzthQUFNLENBQUM7WUFDTixtQkFBVSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQzFCLENBQUM7UUFDRCxPQUFPO0lBQ1QsQ0FBQztJQUNELGVBQWUsRUFBRSxDQUFDLFVBQXNCLEVBQUUsSUFBaUIsRUFBRSxFQUFFO1FBQzdELE1BQU0sTUFBTSxHQUFlLElBQUksdUJBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDNUQsT0FBTyxTQUFHLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUN2QyxDQUFDO0NBQ0YsQ0FBQyJ9