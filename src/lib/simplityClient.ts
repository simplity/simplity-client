import { ClientRuntime, Logger } from 'simplity-types';
import { loggerStub } from './logger-stub/logger';
import { AppElement } from './html/appElement';
import { app } from './controller/app';
import { parseValue } from './validation/validation';

export const simplityClient = {
  /**
   * Simplity uses the console as the default device to log to.
   * a call to setLogger(0 would change to the supplied API.
   * getLogger() returns the one that was set last, or the default logger
   * @returns current logger
   */
  getLogger: () => {
    return loggerStub.getLogger();
  },
  /**
   * change the device/API to which the logs are written.
   * undefined to silence/disable the logging process
   * @param logger
   * @returns
   */
  setLogger: (logger: Logger | undefined) => {
    if (logger) {
      loggerStub.connectLogger(logger);
    } else {
      loggerStub.swallowAll();
    }
    return;
  },

  /**
   * start the html client. This is the last step in the bootstrapping process.
   * @param runtime
   * @param root
   * @returns
   */
  startHtmlClient: (runtime: ClientRuntime, root: HTMLElement) => {
    new AppElement(runtime, root);
    return app.getCurrentAc();
  },

  /**
   * parse a text value as per given value-type. e.g
   * @param text
   * @param valueType
   * @returns value if it is of the right type, undefined otherwise
   */
  parseValue,
};
