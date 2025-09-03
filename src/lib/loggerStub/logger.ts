import { Logger } from 'simplity-types';

declare const console: Logger;

/**
 * no output. Use this to suppress all logging..
 * exported only for testing. not exported as part of this module
 */
export const nullLogger: Logger = {
  info(): void {},
  error(): void {},
  warn(): void {},
};

let worker: Logger = console || nullLogger;

/**
 * logger that uses a stub that can be connected to actual logger used by the app that uses this library
 */
const logger: Logger = {
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
export const loggerStub = {
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
    worker = nullLogger;
  },
  /**
   * connect the stub to a real logger
   * @param logger connect the stub to this app-specific logger
   */
  connectLogger: (logger: Logger) => {
    worker = logger;
  },
  /**
   * disconnect any logger that was connected, and reset it to the default logger
   */
  resetToDefault: () => {
    worker = console || nullLogger;
  },
};
