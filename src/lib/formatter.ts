import {
  BooleanFormatter,
  CustomFormatter,
  FormatterFunction,
  Value,
  ValueFormatter,
} from 'simplity-types';
import { app } from './controller/app';

export function createFormatterFn(
  formatter: ValueFormatter
): FormatterFunction {
  switch (formatter.type) {
    case 'boolean':
      return toBooleanFormatter(formatter);
    case 'custom':
      return toCustomFormatter(formatter);
    default:
      return notYetImplemented(formatter);
  }
}

function notYetImplemented(formatter: ValueFormatter): FormatterFunction {
  return (v: Value) => {
    console.error(
      `Formatting functionality not yet implemented for type=${formatter.type}. Hence formatter is just returning the input value as it is`
    );
    const value = v === undefined ? '' : '' + v;
    return { value };
  };
}

function toBooleanFormatter(formatter: BooleanFormatter): FormatterFunction {
  return (v: Value) => {
    let value = '';
    if (v === undefined) {
      v = formatter.unknownValue;
    } else {
      value = v ? formatter.trueValue : formatter.falseValue;
    }
    return { value };
  };
}

function toCustomFormatter(formatter: CustomFormatter): FormatterFunction {
  const fd = app.getCurrentAc().getFn(formatter.function, 'format');
  return fd.fn as FormatterFunction;
}
