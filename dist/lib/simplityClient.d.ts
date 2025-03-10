import { ClientRuntime, Logger } from 'simplity-types';
import { parseValue } from './validation/validation';
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
    /**
     * start the html client. This is the last step in the bootstrapping process.
     * @param runtime
     * @param root
     * @returns
     */
    startHtmlClient: (runtime: ClientRuntime, root: HTMLElement) => import("simplity-types").AppController;
    /**
     * parse a text value as per given value-type. e.g
     * @param text
     * @param valueType
     * @returns value if it is of the right type, undefined otherwise
     */
    parseValue: typeof parseValue;
};
