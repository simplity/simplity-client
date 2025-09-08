"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simplityClient = void 0;
const logger_1 = require("./loggerStub/logger");
const appElement_1 = require("./html/appElement");
const app_1 = require("./controller/app");
const validation_1 = require("./validation/validation");
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
    /**
     * start the html client. This is the last step in the bootstrapping process.
     * @param runtime
     * @param root
     * @returns
     */
    startHtmlClient: (runtime, root) => {
        new appElement_1.AppElement(runtime, root);
        return app_1.app.getCurrentAc();
    },
    /**
     * parse a text value as per given value-type. e.g
     * @param text
     * @param valueType
     * @returns value if it is of the right type, undefined otherwise
     */
    parseValue: validation_1.parseValue,
};
//# sourceMappingURL=simplityClient.js.map