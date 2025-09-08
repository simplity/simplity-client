"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const logger_1 = require("./logger");
const methods = ['info', 'warn', 'error'];
const expects = [['one'], [2], ['one', 'two']];
function doTest(loggerImpl) {
    const spies = [];
    for (const method of methods) {
        spies.push(globals_1.jest.spyOn(loggerImpl, method));
    }
    const logger = logger_1.loggerStub.getLogger();
    logger.info(expects[0][0]);
    logger.warn(expects[1][0]);
    logger.error(expects[2][0], expects[2][1]);
    for (let i = 0; i < 3; i++) {
        (0, globals_1.expect)(spies[i]).toBeCalledWith(expects[i]);
    }
}
(0, globals_1.describe)('Logger Stub', () => {
    (0, globals_1.it)('should use the right output device', () => {
        doTest(console);
        const testLogger = {
            info() { },
            error() { },
            warn() { },
        };
        //doTest(console);
        logger_1.loggerStub.connectLogger(testLogger);
        doTest(testLogger);
        logger_1.loggerStub.swallowAll();
        doTest(logger_1.nullLogger);
        //@ts-ignore
        global.console = undefined;
        logger_1.loggerStub.resetToDefault();
        doTest(logger_1.nullLogger);
    });
});
//# sourceMappingURL=logger.test.js.map