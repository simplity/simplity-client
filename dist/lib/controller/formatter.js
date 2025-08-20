import { app } from './app';
/**
 * Used by app-controller to create functions from the formatter meta-data.
 * @param formatter The formatter meta-data that defines how to format the value.
 * @returns A function that takes a value and returns a formatted value.
 */
export function createFormatterFn(formatter) {
    switch (formatter.type) {
        case 'boolean':
            return toBooleanFormatter(formatter);
        case 'custom':
            return toCustomFormatter(formatter);
        default:
            return notYetImplemented(formatter);
    }
}
function notYetImplemented(formatter) {
    return (v) => {
        console.error(`Formatting functionality not yet implemented for type=${formatter.type}. Hence formatter is just returning the input value as it is`);
        const value = v === undefined ? '' : '' + v;
        return { value };
    };
}
function toBooleanFormatter(formatter) {
    return (v) => {
        let value = '';
        if (v === undefined) {
            v = formatter.unknownValue;
        }
        else {
            value = v ? formatter.trueValue : formatter.falseValue;
        }
        return { value };
    };
}
function toCustomFormatter(formatter) {
    const fd = app.getCurrentAc().getFn(formatter.function, 'format');
    return fd.fn;
}
//# sourceMappingURL=formatter.js.map