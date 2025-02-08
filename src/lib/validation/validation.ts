import {
  Value,
  ValueSchema,
  ValueType,
  ValueValidationFn,
  ValueValidationResult,
} from 'simplity-types';
export const DEFAULT_MAX_CHARS = 1000;
export const DEFAULT_DAYS_RANGE = 365000;
export const DEFAULT_MAX_NUMBER = Number.MAX_SAFE_INTEGER;
export const DEFAULT_NBR_DECIMALS = 2;

const DEFAULT_FACTOR = 10 ** DEFAULT_NBR_DECIMALS;
const NUMBER_REGEX = /^[+-]?(\d+(\.\d*)?|\.\d+)$/;
const DATE_REGEX = /^\d\d\d\d-\d\d-\d\d$/;
const TIME_REGEX = /^T\d\d:\d\d:\d\d\.\d\d\dZ$/;

const TEXT_ERROR: ValueValidationResult = {
  messages: [{ alertType: 'error', messageId: '_invalidText' }],
};
const BOOL_ERROR: ValueValidationResult = {
  messages: [{ alertType: 'error', messageId: '_invalidBoolean' }],
};
const NUMBER_ERROR: ValueValidationResult = {
  messages: [{ alertType: 'error', messageId: '_invalidNumber' }],
};
const DATE_ERROR: ValueValidationResult = {
  messages: [{ alertType: 'error', messageId: '_invalidDate' }],
};
const STAMP_ERROR: ValueValidationResult = {
  messages: [{ alertType: 'error', messageId: '_invalidTimestamp' }],
};

/**
 * type definitions internally used for improving code quality
 */
type SchemaForText = {
  minLength: number;
  maxLength: number;
  regex?: RegExp;
};

type SchemaForDate = {
  minValue: number;
  maxValue: number;
};

type SchemaForNumber = SchemaForDate & {
  factor: number;
};

/**
 * validate that the text is of the right value type with no other constraints
 * @param text
 * @param valueType
 * @returns true if the text is of the right value type. false otherwise.
 */
export function parseToValue(
  textValue: string,
  valueType: ValueType
): Value | undefined {
  const text = textValue.trim();

  switch (valueType) {
    case 'boolean':
      return parseBoolean(text);

    case 'date':
      const d = parseDate(text);
      if (d) {
        return d.toISOString().substring(0, 10);
      }
      return undefined;

    case 'decimal':
    case 'integer':
      return parseNumber(text);

    case 'text':
      return text;
    case 'timestamp':
      if (parseTimestamp(text) === undefined) {
        return undefined;
      }
      return text;
    /**
     * run-time created components may miss this
     */
    default:
      return text;
  }
}
/**
 * creates a function that can be used to validate a value against the supplied value-schema
 * @param schema schema json. Typically entered as met-date by designers, or generated by utilities
 * @returns validation function
 */
export function createValidationFn(schema: ValueSchema): ValueValidationFn {
  /**
   * all the parameters required for validation
   */

  let s = schema as SchemaForText;
  let minLength = s.minLength || 0;
  let maxLength = s.maxLength || DEFAULT_MAX_CHARS;
  let regex = s.regex ? new RegExp(s.regex) : undefined;
  let minValue = 0; //we deal with business data, and hence negative numbers not allowed by default
  let maxValue = DEFAULT_MAX_NUMBER;

  switch (schema.valueType) {
    case 'text':
      return createTextFn({
        maxLength,
        minLength,
        regex,
      });

    case 'boolean':
      return validateBoolean;

    case 'integer':
      if (schema.minValue !== undefined) {
        minValue = Math.round(schema.minValue);
      }

      if (schema.maxValue !== undefined) {
        maxValue = Math.round(schema.maxValue);
      }

      return createNumberFn({
        factor: 1,
        maxValue,
        minValue,
      });

    case 'decimal':
      let factor = DEFAULT_FACTOR;
      let nbr = schema.nbrDecimalPlaces && schema.nbrDecimalPlaces;
      if (nbr && nbr > 0) {
        nbr = Math.round(nbr);
        factor = 10 ** nbr;
      }

      if (schema.minValue !== undefined) {
        minValue = roundIt(schema.minValue, factor);
      }

      if (schema.maxValue !== undefined) {
        maxValue = roundIt(schema.maxValue, factor);
      }
      return createNumberFn({
        factor,
        maxValue,
        minValue,
      });

    case 'date':
    case 'timestamp':
      if (schema.maxPastDays !== undefined) {
        minValue = -Math.round(schema.maxPastDays);
      } else {
        minValue = -DEFAULT_DAYS_RANGE;
      }

      if (schema.maxFutureDays !== undefined) {
        maxValue = Math.round(schema.maxFutureDays);
      } else {
        maxValue = DEFAULT_DAYS_RANGE;
      }

      if (schema.valueType === 'date') {
        return createDateFn({
          maxValue,
          minValue,
        });
      }
      return createTimestampFn({
        maxValue,
        minValue,
      });
    default:
      throw new Error(
        `${(schema as any).valueType} is not a valid value type. Can not process this value-schema`
      );
  }
}

/*
 * createXxxFn functions are  designed to minimize the scope of teh closure around the returned function
 */
function createTextFn(schema: SchemaForText): ValueValidationFn {
  return (p: { value: string }) => {
    return validateString(schema, p.value);
  };
}

function createNumberFn(schema: SchemaForNumber): ValueValidationFn {
  return (p: { value: string }) => {
    return validateNumber(schema, p.value);
  };
}

function createDateFn(schema: SchemaForDate): ValueValidationFn {
  return (p: { value: string }) => {
    return validateDate(schema, p.value);
  };
}

function createTimestampFn(schema: SchemaForDate): ValueValidationFn {
  return (p: { value: string }) => {
    return validateTimestamp(schema, p.value);
  };
}

/*
 * run-time validation functions that use our internal schema parameters
 */
function validateString(
  schema: SchemaForText,
  value: string
): ValueValidationResult {
  //playing it safe with non-string argument
  if (value === undefined || value === null || Number.isNaN(value)) {
    return TEXT_ERROR;
  }

  const s = value.toString().trim();
  const len = s.length;
  if (len < schema.minLength!) {
    return {
      messages: [
        {
          alertType: 'error',
          messageId: '_minLength',
          params: [schema.minLength + ''],
        },
      ],
    };
  }

  if (len > schema.maxLength!) {
    return {
      messages: [
        {
          alertType: 'error',
          messageId: '_maxLength',
          params: [schema.maxLength + ''],
        },
      ],
    };
  }

  if (schema.regex && schema.regex.test(s) === false) {
    return TEXT_ERROR;
  }

  return { value: s };
}

function validateNumber(
  schema: SchemaForNumber,
  value: string
): ValueValidationResult {
  //playing it safe with non-string argument
  const str = (value + '').trim();
  if (!NUMBER_REGEX.test(str)) {
    return NUMBER_ERROR;
  }

  let nbr = Number.parseFloat(str);
  if (Number.isNaN(nbr)) {
    return NUMBER_ERROR;
  }

  //make it an integer or decimal to the right number of decimal places
  nbr = Math.round(nbr * schema.factor) / schema.factor;

  if (nbr < schema.minValue) {
    return {
      messages: [
        {
          alertType: 'error',
          messageId: '_minValue',
          params: [schema.minValue + ''],
        },
      ],
    };
  }

  if (nbr > schema.maxValue) {
    return {
      messages: [
        {
          alertType: 'error',
          messageId: '_maxValue',
          params: [schema.maxValue + ''],
        },
      ],
    };
  }

  return { value: nbr };
}

/**
 * very special case for boolean because of TS/JS issues:
 *
 * @param value
 * @returns
 */
function validateBoolean(param: { value: string }): ValueValidationResult {
  const value = param.value;
  if (value === undefined || value === null || Number.isNaN(value)) {
    return { value: false };
  }

  //playing it safe with non-string argument
  const text = (value + '').trim().toLowerCase();
  if (text === 'true' || text == '1') {
    return { value: true };
  }

  if (text === 'false' || text == '0') {
    return { value: false };
  }

  return BOOL_ERROR;
}

function validateDate(
  schema: SchemaForDate,
  value: string
): ValueValidationResult {
  /**
   * Design Note:
   * For a data-type = 'date', time zone is not applicable.
   * Unfortunately, both Java and Javascript created huge confusion with the definition of Date as  number of milliseconds
   * For all we care, it could have been number of days from 1960-jan-01.
   * Java fixed it later, but JS still has the same issue.
   *
   * We follow this simple convention for "pure dates":
   * 1. Today means the date as per local time zone, not the date as per UTC.
   * 2. Date object should always be in UTC, and not in local time zone.
   * 3. If we have to render the date, we ensure that we get YYYY-MM-DD from the UTC and render the date part accordingly.
   *  This looks like an unnecessary complexity, but it is worth it.
   *
   * e.g.
   * if it is 2 AM IST on 20-Jan-25 (+5:30), the date Object to be created is "2025-01-20T00.00.00.000Z".
   * Similarly, if the date object is "2025-01-20T00.00.00.000Z", the date-part to be rendered is "2025-01-20",
   * Of course it could be 20/01/2025, 20-Jan-2025 etc... But we do not render anything about time, or time zone.
   *
   *
   */
  const date = parseDate(value);
  if (date === undefined) {
    return DATE_ERROR;
  }

  const ms = date.valueOf();
  const now = new Date();
  const localY = now.getFullYear();
  const localM = now.getMonth();
  const localD = now.getDate();
  //Date constructor allows us to just add days to get the desired date object
  let refMs = Date.UTC(localY, localM, localD + schema.minValue);
  if (ms < refMs) {
    return {
      messages: [
        {
          alertType: 'error',
          messageId: '_earliestDate',
          params: [new Date(refMs).toISOString().substring(0, 10)],
        },
      ],
    };
  }

  refMs = Date.UTC(localY, localM, localD + schema.maxValue);
  if (ms > refMs) {
    return {
      messages: [
        {
          alertType: 'error',
          messageId: '_latestDate',
          params: [new Date(refMs).toISOString().substring(0, 10)],
        },
      ],
    };
  }
  // note that we use date-string as the value for date fields
  return { value: date.toISOString().substring(0, 10) };
}

function validateTimestamp(
  schema: SchemaForDate,
  value: Value
): ValueValidationResult {
  /**
   * time-stamp is ALWAYS in UTC, and treated that way.
   * For rendering, we will use local-date-time formatting.
   * VERY IMPORTANT: We try our best to avoid rendering a time-stamp as just date.
   * We try and push the server to send us the date as a separate field, if that makes sense from the business perspective.
   * However, if it is really required, we very clearly document the meaning of the date as
   *  1. As per local time-zone or 2. as per UTC.
   */
  const valueStr = (value + '').trim();
  if (valueStr.length !== 24) {
    return STAMP_ERROR;
  }

  let str = valueStr.substring(0, 10);
  const res = validateDate(schema, str);
  const msg = res.messages && res.messages[0];
  if (msg) {
    if (msg.params) {
      //max-min error
      return res;
    }
    return STAMP_ERROR;
  }

  str = valueStr.substring(10, 24);
  if (!TIME_REGEX.test(str)) {
    return STAMP_ERROR;
  }

  const hrs = Number.parseInt(str.substring(1, 3), 10);
  const mns = Number.parseInt(str.substring(4, 6), 10);
  const secs = Number.parseFloat(str.substring(7, 13));
  if (
    hrs > 24 ||
    mns > 59 ||
    secs > 59 || //we will not validate leap second!!
    (hrs === 24 && (mns > 0 || secs > 0))
  ) {
    return STAMP_ERROR;
  }

  return { value: valueStr };
}

function roundIt(n: number, factor: number): number {
  return Math.round(n * factor) / factor;
}

function parseBoolean(text: string): boolean | undefined {
  const t = text.trim().toLowerCase();
  if (t === 'true' || t === '1') {
    return true;
  }
  if (t === 'false' || t === '0') {
    return false;
  }
  return undefined;
}

function parseNumber(text: string): number | undefined {
  const n = Number.parseFloat(text.trim());
  if (isNaN(n)) {
    return undefined;
  }
  return n;
}

function parseDate(text: string): Date | undefined {
  const str = text.trim();
  if (NUMBER_REGEX.test(str)) {
    //date is given as number of days relative to today
    let nbr = Number.parseFloat(str);
    if (Number.isNaN(nbr)) {
      return undefined;
    }
    nbr = Math.round(nbr);
    //get local year, month and date, and construct a date relative to these
    //get the local-date object as per our standard
    const now = new Date();
    return new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + nbr)
    );
  }

  if (!DATE_REGEX.test(str)) {
    return undefined;
  }
  const yyyy = Number.parseInt(str.substring(0, 4), 10);
  const mm = Number.parseInt(str.substring(5, 7), 10) - 1; //month index
  const dd = Number.parseInt(str.substring(8, 10), 10);
  const date = new Date(Date.UTC(yyyy, mm, dd));

  if (
    dd === date.getDate() &&
    mm === date.getMonth() &&
    yyyy === date.getFullYear()
  ) {
    return date;
  }

  return undefined;
}

function parseTimestamp(text: string): Date | undefined {
  const valueStr = (text + '').trim();
  if (valueStr.length !== 24) {
    return undefined;
  }

  let date = parseDate(valueStr.substring(0, 10));
  if (date === undefined) {
    return undefined;
  }

  const str = valueStr.substring(10, 24);
  if (!TIME_REGEX.test(str)) {
    return undefined;
  }

  const hrs = Number.parseInt(str.substring(1, 3), 10);
  const mns = Number.parseInt(str.substring(4, 6), 10);
  const secs = Number.parseFloat(str.substring(7, 13));
  if (
    hrs > 24 ||
    mns > 59 ||
    secs > 59 || //we will not validate leap second!!
    (hrs === 24 && (mns > 0 || secs > 0))
  ) {
    return undefined;
  }
  date.setHours(hrs, mns, secs, mns);
  return date;
}
