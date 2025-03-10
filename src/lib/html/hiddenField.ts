import { DataField, FormController, Value } from 'simplity-types';
import { BaseElement } from './baseElement';
import { parseValue } from '../validation/validation';

export class HiddenField extends BaseElement {
  constructor(
    fc: FormController | undefined,
    public readonly field: DataField,
    maxWidth: number,
    value?: Value
  ) {
    super(fc, field, '', maxWidth);
    if (!fc) {
      return;
    }
    let val = value;
    if (val === undefined) {
      val = this.getDefaultValue();
    }
    if (val !== undefined) {
      if (this.fc) {
        this.fc.valueHasChanged(this.name, val);
      }
    }
  }

  private getDefaultValue(): Value | undefined {
    const text = this.field.defaultValue;
    if (!text) {
      return undefined;
    }
    return parseValue(text, this.field.valueType);
  }
}
