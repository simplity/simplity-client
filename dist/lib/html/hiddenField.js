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
        return (0, validation_1.parseToValue)(text, this.field.valueType);
    }
}
exports.HiddenField = HiddenField;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlkZGVuRmllbGQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2h0bWwvaGlkZGVuRmllbGQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsK0NBQTRDO0FBQzVDLHlEQUF3RDtBQUV4RCxNQUFhLFdBQVksU0FBUSx5QkFBVztJQUMxQyxZQUNFLEVBQThCLEVBQ2QsS0FBZ0IsRUFDaEMsUUFBaUIsRUFDakIsS0FBYTtRQUViLEtBQUssQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUpmLFVBQUssR0FBTCxLQUFLLENBQVc7UUFLaEMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ1IsT0FBTztRQUNULENBQUM7UUFDRCxJQUFJLEdBQUcsR0FBRyxLQUFLLENBQUM7UUFDaEIsSUFBSSxHQUFHLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDdEIsR0FBRyxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUMvQixDQUFDO1FBQ0QsSUFBSSxHQUFHLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDdEIsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ1osSUFBSSxDQUFDLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztZQUMxQyxDQUFDO1FBQ0gsQ0FBQztJQUNILENBQUM7SUFFTyxlQUFlO1FBQ3JCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDO1FBQ3JDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNWLE9BQU8sU0FBUyxDQUFDO1FBQ25CLENBQUM7UUFDRCxPQUFPLElBQUEseUJBQVksRUFBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNsRCxDQUFDO0NBQ0Y7QUE3QkQsa0NBNkJDIn0=