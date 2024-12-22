import { Value, ValueType } from 'simplity-types';
/**
 * validate that the text is of the right value type with no other constraints
 * @param text
 * @param valueType
 * @returns true if the text is of the right value type. false otherwise.
 */
export declare function parseToValue(textValue: string, valueType: ValueType): Value | undefined;
