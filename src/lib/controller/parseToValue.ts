import { Value, ValueType } from 'simplity-types';
const DATE_REGEX = /^\d\d\d\d-\d\d-\d\d$/;
const TIME_REGEX = /^T\d\d:\d\d:\d\d\.\d\d\dZ$/;

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
      if (parseDate(text) === undefined) {
        return undefined;
      }
      return text;

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
  const str = (text + '').trim();
  if (!DATE_REGEX.test(str)) {
    return undefined;
  }
  const yyyy = Number.parseInt(str.substring(0, 4), 10);
  const mm = Number.parseInt(str.substring(5, 7), 10) - 1; //month index
  const dd = Number.parseInt(str.substring(8, 10), 10);
  const dateMs = Date.UTC(yyyy, mm, dd);
  const date = new Date(dateMs);

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
