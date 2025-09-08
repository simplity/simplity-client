"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggerStub = exports.nullLogger = void 0;
/**
 * no output. Use this to suppress all logging..
 * exported only for testing. not exported as part of this module
 */
exports.nullLogger = {
    info() { },
    error() { },
    warn() { },
};
let worker = console || exports.nullLogger;
/**
 * logger that uses a stub that can be connected to actual logger used by the app that uses this library
 */
const logger = {
    error(...args) {
        worker.error(args);
    },
    warn(...args) {
        worker.warn(args);
    },
    info(...args) {
        worker.info(args);
    },
};
/**
 * Logger stub that should be used for logging. This can be connected to any standard logger by the main app
 */
exports.loggerStub = {
    /**
     *
     * @returns current logger that is connected to the stub.
     * Default logger outputs to the console.
     * Logs are swallowed in case the console is not provided in the run-time context
     */
    getLogger: () => {
        return logger;
    },
    /**
     * stub is connected to logger that does no output
     */
    swallowAll: () => {
        worker = exports.nullLogger;
    },
    /**
     * connect the stub to a real logger
     * @param logger connect the stub to this app-specific logger
     */
    connectLogger: (logger) => {
        worker = logger;
    },
    /**
     * disconnect any logger that was connected, and reset it to the default logger
     */
    resetToDefault: () => {
        worker = console || exports.nullLogger;
    },
};
//# sourceMappingURL=logger.js.map