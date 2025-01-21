"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
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
    startHtmlClient: (runtime, root) => {
        new appElement_1.AppElement(runtime, root);
        return app_1.app.getCurrentAc();
    },
};
__exportStar(require("./lib/html/htmlUtil"), exports);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSw4Q0FBMkM7QUFDM0Msc0RBQW1EO0FBQ25ELHFEQUFzRDtBQUV6QyxRQUFBLGNBQWMsR0FBRztJQUM1Qjs7Ozs7T0FLRztJQUNILFNBQVMsRUFBRSxHQUFHLEVBQUU7UUFDZCxPQUFPLG1CQUFVLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDaEMsQ0FBQztJQUNEOzs7OztPQUtHO0lBQ0gsU0FBUyxFQUFFLENBQUMsTUFBMEIsRUFBRSxFQUFFO1FBQ3hDLElBQUksTUFBTSxFQUFFLENBQUM7WUFDWCxtQkFBVSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNuQyxDQUFDO2FBQU0sQ0FBQztZQUNOLG1CQUFVLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDMUIsQ0FBQztRQUNELE9BQU87SUFDVCxDQUFDO0lBQ0QsZUFBZSxFQUFFLENBQUMsT0FBc0IsRUFBRSxJQUFpQixFQUFFLEVBQUU7UUFDN0QsSUFBSSx1QkFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUM5QixPQUFPLFNBQUcsQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUM1QixDQUFDO0NBQ0YsQ0FBQztBQUVGLHNEQUFvQyJ9