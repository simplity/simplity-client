import { Logger, ClientRuntime } from 'simplity-types';
export declare const simplityClient: {
    /**
     * Simplity uses the console as the default device to log to.
     * a call to setLogger(0 would change to the supplied API.
     * getLogger() returns the one that was set last, or the default logger
     * @returns current logger
     */
    getLogger: () => Logger;
    /**
     * change the device/API to which the logs are written.
     * undefined to silence/disable the logging process
     * @param logger
     * @returns
     */
    setLogger: (logger: Logger | undefined) => void;
    startHtmlClient: (runtime: ClientRuntime, root: HTMLElement) => import("simplity-types").AppController;
};
