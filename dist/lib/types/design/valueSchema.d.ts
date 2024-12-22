/**
 * primitive value types,
 */
export type ValueType = 'text' | 'integer' | 'decimal' | 'boolean' | 'date' | 'timestamp';
/**
 * meta-data for checking if a given value is suitable for a value-schema
 * boolean-type uses no meta data, and has a fixed value set of (true, false, 1, 0)
 *
 * a function that uses a pre-defined schema/logic to validate the supplied argument.
 * It converts/parses the arguments if required and returns the value with the right type.
 * In case of an error, it returns the error code, along with run-time error-parameters if required.
 *
 * NOTE-1: undefined, null and NaN are considered invalid for all value types, except for boolean.
 * null, undefined, NaN, empty string, 0, '0',false, 'false' are false values
 * while  true, 'true', 1 and '1' are true values.
 *
 * NOTE-2: if the text value accepts unicode characters,
 * then min/max length are generally not reliable from end-user's perspective.
 * e.g. how would an end-user count number of characters in 'ಒಂದು'?
 * It is possible to count the number of characters, but it may not be useful.
 * Hence we are just using string.length that is not at all reliable when it comes to unicode characters.
 *
 * NOTE-3: for timestamp, date-part is validated like date.
 * Time part is validated for entire-day. No facility to restrict time-part.
 */
export type ValueSchema = TextSchema | IntegerSchema | DecimalSchema | BooleanSchema | DateSchema | TimestampSchema;
type BaseSchema = {
    name: string;
    description?: string;
    valueType: ValueType;
    /**
     * name of the message to be used to locate and format the actual error message
     */
    messageName?: string;
    /**
     * name of a validation function that is to be used to validate beyond the value-type based validation.
     * This function is to be provided at the client-app as well as the server-app level
     */
    validationFn?: string;
};
export type TextSchema = BaseSchema & {
    valueType: 'text';
    /**
     * defaults to 1.
     * NOTE: unicode characters are not counted properly. Use with care.
     */
    minLength?: number;
    /**
     * defaults to 1000.
     * NOTE: unicode characters are not counted properly. Use with care.
     */
    maxLength?: number;
    /**
     * as per javascript RegExp syntax.
     */
    regex?: string;
};
export type IntegerSchema = BaseSchema & {
    valueType: 'integer';
    /**
     * defaults to 0
     */
    minValue?: number;
    /**
     * defaults to Number.MAX_SAFE_INTEGER for
     */
    maxValue?: number;
};
export type DecimalSchema = BaseSchema & {
    valueType: 'decimal';
    /**
     * defaults to 0
     */
    minValue?: number;
    /**
     * defaults to Number.MAX_SAFE_INTEGER for
     */
    maxValue?: number;
    /**
     * defaults to 2.
     * numbers will be rounded based on this.
     */
    nbrDecimalPlaces?: number;
};
export type DateSchema = BaseSchema & {
    valueType: 'date';
    /**
     * defaults to 0.
     * this is the number of days into the past from today
     * if this is set to 10 it means that the date can at most be 10 days into the past from today
     * -10 means that the date has to be a minimum of 1- days into the future from today.
     * 0 means today is acceptable, but no past dates.
     */
    maxPastDays?: number;
    /**
     * defaults to 365,000, allowing roughly 1000 years into the future
     * 0 means today is acceptable, but no future days.
     * 10 means max ten days into the future.
     * -10 means that the dates have to be in the past, and can be at most 10 days into the future from today
     */
    maxFutureDays?: number;
};
export type TimestampSchema = BaseSchema & {
    valueType: 'timestamp';
    /**
     * defaults to 0.
     * this is the number of days into the past from today
     * if this is set to 10 it means that the date can at most be 10 days into the past from today
     * -10 means that the date has to be a minimum of 1- days into the future from today.
     * 0 means today is acceptable, but no past dates.
     */
    maxPastDays?: number;
    /**
     * defaults to 365,000, allowing roughly 1000 years into the future
     * 0 means today is acceptable, but no future days.
     * 10 means max ten days into the future.
     * -10 means that the dates have to be in the past, and can be at most 10 days into the future from today
     */
    maxFutureDays?: number;
};
export type BooleanSchema = BaseSchema & {
    valueType: 'boolean';
};
export {};
