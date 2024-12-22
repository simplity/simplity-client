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
        console.info('worker is:', worker);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9sb2dnZXItc3R1Yi9sb2dnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBSUE7OztHQUdHO0FBQ1UsUUFBQSxVQUFVLEdBQVc7SUFDaEMsSUFBSSxLQUFVLENBQUM7SUFDZixLQUFLLEtBQVUsQ0FBQztJQUNoQixJQUFJLEtBQVUsQ0FBQztDQUNoQixDQUFDO0FBRUYsSUFBSSxNQUFNLEdBQVcsT0FBTyxJQUFJLGtCQUFVLENBQUM7QUFFM0M7O0dBRUc7QUFDSCxNQUFNLE1BQU0sR0FBVztJQUNyQixLQUFLLENBQUMsR0FBRyxJQUFJO1FBQ1gsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNyQixDQUFDO0lBQ0QsSUFBSSxDQUFDLEdBQUcsSUFBSTtRQUNWLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDcEIsQ0FBQztJQUNELElBQUksQ0FBQyxHQUFHLElBQUk7UUFDVixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3BCLENBQUM7Q0FDRixDQUFDO0FBRUY7O0dBRUc7QUFDVSxRQUFBLFVBQVUsR0FBRztJQUN4Qjs7Ozs7T0FLRztJQUNILFNBQVMsRUFBRSxHQUFHLEVBQUU7UUFDZCxPQUFPLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNuQyxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBQ0Q7O09BRUc7SUFDSCxVQUFVLEVBQUUsR0FBRyxFQUFFO1FBQ2YsTUFBTSxHQUFHLGtCQUFVLENBQUM7SUFDdEIsQ0FBQztJQUNEOzs7T0FHRztJQUNILGFBQWEsRUFBRSxDQUFDLE1BQWMsRUFBRSxFQUFFO1FBQ2hDLE1BQU0sR0FBRyxNQUFNLENBQUM7SUFDbEIsQ0FBQztJQUNEOztPQUVHO0lBQ0gsY0FBYyxFQUFFLEdBQUcsRUFBRTtRQUNuQixNQUFNLEdBQUcsT0FBTyxJQUFJLGtCQUFVLENBQUM7SUFDakMsQ0FBQztDQUNGLENBQUMifQ==