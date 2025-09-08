"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HiddenField = void 0;
const baseElement_1 = require("./baseElement");
const validation_1 = require("../validation/validation");
class HiddenField extends baseElement_1.BaseElement {
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
        return (0, validation_1.parseValue)(text, this.field.valueType);
    }
}
exports.HiddenField = HiddenField;
//# sourceMappingURL=hiddenField.js.map