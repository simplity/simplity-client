import { BaseElement } from './baseElement';
import { parseToValue } from '../validation/validation';
export class HiddenField extends BaseElement {
    field;
    constructor(fc, field, maxWidth, value) {
        super(fc, field, '', maxWidth);
        this.field = field;
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
    getDefaultValue() {
        const text = this.field.defaultValue;
        if (!text) {
            return undefined;
        }
        return parseToValue(text, this.field.valueType);
    }
}
//# sourceMappingURL=hiddenField.js.map