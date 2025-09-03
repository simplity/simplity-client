import { Logger } from 'simplity-types';
/**
 * no output. Use this to suppress all logging..
 * exported only for testing. not exported as part of this module
 */
export declare const nullLogger: Logger;
/**
 * Logger stub that should be used for logging. This can be connected to any standard logger by the main app
 */
export declare const loggerStub: {
    /**
     *
     * @returns current logger that is connected to the stub.
     * Default logger outputs to the console.
     * Logs are swallowed in case the console is not provided in the run-time context
     */
    getLogger: () => Logger;
    /**
     * stub is connected to logger that does no output
     */
    swallowAll: () => void;
    /**
     * connect the stub to a real logger
     * @param logger connect the stub to this app-specific logger
     */
    connectLogger: (logger: Logger) => void;
    /**
     * disconnect any logger that was connected, and reset it to the default logger
     */
    resetToDefault: () => void;
};
