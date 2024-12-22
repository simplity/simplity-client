import {
  AppController,
  AppView,
  PageController,
  PageView,
  RuntimeApp,
  systemMessages,
} from 'simplity-types';
import { PC } from './pageController';
import { loggerStub } from '../logger-stub/logger';
import { AC } from './appController';
import { util } from './util';

let logger = loggerStub.getLogger();

let pc: PageController;
let ac: AppController;

/**
 * utility to create controllers
 */
export const app = {
  /**
   * constants/conventions that are used across layers.
   * These are fixed at design time. deployment-time parameters can be found in Config
   */
  Conventions: {
    /**
     * name of the style in gridStyles collection that is to be used as a default style
     */
    defaultGridStyle: '_defaultStyle',
    /**
     * special pre-defined service to get drop-down values
     */
    listServiceName: '_getList',

    /**
     * special pre-defined service to get drop-down values
     */
    reportServiceName: '_getReportSettings',
    /**
     * user attribute that has the list of allowed menu ids
     */
    allowedMenuIds: 'allowedMenuIds',
    /**
     * value is required
     */
    errorValueIsRequired: systemMessages._valueRequired,
    /**
     * generic error message when validation fails and  no specific error id is specified
     */
    errorInvalidValue: systemMessages._invalidValue,
    /**
     * general error message when reg-ex fails, and the value schema does not provide specific error
     */
    errorSchemaIsMissing: systemMessages._missingSchema,
  },

  /**
   * create an App Controller.
   * This instance is the return-value for subsequent calls to getController()

   * @param runtimeApp
   * @param appView
   * @returns
   */
  newAc: (runtimeApp: RuntimeApp, appView: AppView) => {
    if (ac) {
      logger.warn(
        `The controller for app ${runtimeApp.name} exists, but a new one being created. This is an ERROR in production mode`
      );
    }

    ac = new AC(runtimeApp, appView);
    return ac;
  },

  /**
   * To be invoked ONLY after createNew() is invoked. An error is thrown otherwise.
   * @returns current active instance
   * @throws error if no instance is created
   */
  getCurrentAc: () => {
    if (!ac) {
      throw new Error('Controller is being requested before instantiating it');
    }

    return ac;
  },

  /**
   * create the controller for this page and save it for subsequent calls to getCurrentPageController()
   * @param view page view component
   * @returns
   */
  newPc: (view: PageView): PageController => {
    pc = new PC(view);
    return pc;
  },

  /**
   *
   * @returns the last created controller.
   * @throws error is no controller was created
   */
  getCurrentPc: (): PageController => {
    if (pc) {
      return pc;
    }
    const msg =
      'request received to get the current page controller, but none is created yet.';
    logger.error(msg);
    throw new Error(msg);
  },
  util: util,
};
