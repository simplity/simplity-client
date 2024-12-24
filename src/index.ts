import { Logger, RuntimeApp } from 'simplity-types';
import { app } from './lib/controller/app';
import { AppElement } from './lib/html/appElement';
import { loggerStub } from './lib/logger-stub/logger';

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
  startHtmlClient: (runtimeApp: RuntimeApp, root: HTMLElement) => {
    const appEle: AppElement = new AppElement(runtimeApp, root);
    return app.newAc(runtimeApp, appEle);
  },
};
