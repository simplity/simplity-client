import { ClientRuntime, Logger } from 'simplity-types';
import { loggerStub } from './logger-stub/logger';
import { AppElement } from './html/appElement';
import { app } from './controller/app';

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
  startHtmlClient: (runtime: ClientRuntime, root: HTMLElement) => {
    new AppElement(runtime, root);
    return app.getCurrentAc();
  },
};
