import { FormatterFunction, ValueFormatter } from 'simplity-types';
/**
 * Used by app-controller to create functions from the formatter meta-data.
 * @param formatter The formatter meta-data that defines how to format the value.
 * @returns A function that takes a value and returns a formatted value.
 */
export declare function createFormatterFn(formatter: ValueFormatter): FormatterFunction;
