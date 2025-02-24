import { describe, expect, it, jest } from '@jest/globals';
import { loggerStub, nullLogger } from './logger';
const methods = ['info', 'warn', 'error'];
const expects = [['one'], [2], ['one', 'two']];
function doTest(loggerImpl) {
    const spies = [];
    for (const method of methods) {
        spies.push(jest.spyOn(loggerImpl, method));
    }
    const logger = loggerStub.getLogger();
    logger.info(expects[0][0]);
    logger.warn(expects[1][0]);
    logger.error(expects[2][0], expects[2][1]);
    for (let i = 0; i < 3; i++) {
        expect(spies[i]).toBeCalledWith(expects[i]);
    }
}
describe('Logger Stub', () => {
    it('should use the right output device', () => {
        doTest(console);
        const testLogger = {
            info() { },
            error() { },
            warn() { },
        };
        //doTest(console);
        loggerStub.connectLogger(testLogger);
        doTest(testLogger);
        loggerStub.swallowAll();
        doTest(nullLogger);
        //@ts-ignore
        global.console = undefined;
        loggerStub.resetToDefault();
        doTest(nullLogger);
    });
});
//# sourceMappingURL=logger.test.js.map