"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FieldElement = void 0;
const simplity_types_1 = require("simplity-types");
const baseElement_1 = require("./baseElement");
const htmlUtil_1 = require("./htmlUtil");
const NO_VALIDATION = ['output', 'select-output'];
/**
 * Field is an element that has to render the value that it is given at run time.
 * Input fields allow the user to enter/alter the value.
 * This is the base class for all the fields.
 */
class FieldElement extends baseElement_1.BaseElement {
    /**
     * to be called from the concrete class after rendering itself in the constructor
     */
    constructor(fc, comp, value, inColumn) {
        super(fc, comp, comp.renderAs);
        this.comp = comp;
        /**
         * we have implemented only HTMl client as of now.
         * value being string fits that quite well.
         *
         * only check-box requires a boolean as of now.
         * Once we implement date-pickers, we may change our mind!!!
         * Also, the last thing we want the end-user to see in a text-field is '#undefined'
         */
        this.textValue = '';
        /**
         * value as seen by the external world.
         * if the entered value is invalid, say a numeric field has a textValue of "abcd", this field is ""
         * this approach is to avoid having undefined as a value, leaving that to detect "irrelevant" or "not-used" fields
         */
        this.value = '';
        this.valueIsValid = true;
        /**
         * '' if this field is valid.
         */
        this.errorMessage = '';
        /**
         * used only to temporarily hide the field.
         * permanently hidden fields are never rendered.
         */
        //private isHidden: boolean = false;
        /**
         * temporarily disabled. disabled fields should not be rendered as input fields
         */
        this.isDisabled = false;
        /**
         * 0-based row number, in case this field is rendered as a column in a table-row
         */
        //private rowId = -1;
        //private isColumn = false;
        /**
         * relevant if this field has a drop-down list associated with it.
         * fds ensures that this list has the right value always
         */
        this.list = [];
        this.fieldRendering = 'hidden';
        this.dataField = comp;
        this.fieldRendering = comp.renderAs;
        this.fieldEle = htmlUtil_1.htmlUtil.getChildElement(this.root, 'field');
        /**
         * uncontrolled fields are to be disabled. Typically in a table-row
         */
        if (!fc) {
            this.fieldEle.setAttribute('disabled', '');
        }
        /**
         * no labels inside grids
         */
        if (inColumn && this.labelEle) {
            this.labelEle.remove();
            this.labelEle = undefined;
        }
        this.fieldEle.setAttribute('name', comp.name);
        if (NO_VALIDATION.indexOf(this.dataField.renderAs) === -1) {
            this.errorEle = htmlUtil_1.htmlUtil.getOptionalElement(this.root, 'error');
        }
        //important to set the default value before wiring the events
        if (value !== undefined) {
            this.setValue(value);
        }
        else {
            [this.value, this.textValue] = this.getDefaultValue();
            if (this.value !== '' && this.fc) {
                this.fc.valueHasChanged(this.name, this.value);
            }
        }
        if (comp.listOptions) {
            this.setList(comp.listOptions);
        }
        this.wireEvents();
    }
    setValue(value) {
        if (value === undefined) {
            value = '';
        }
        this.value = value;
        const text = value.toString();
        this.textValue = text;
        switch (this.fieldRendering) {
            case 'text-field':
            case 'password':
            case 'text-area':
                this.fieldEle.value = text;
                return;
            case 'select':
                this.setValueToSelect(text);
                return;
            case 'output':
                this.fieldEle.innerText = text;
                return;
            case 'select-output':
                this.fieldEle.innerText = this.getSelectValue(text);
                return;
            case 'check-box':
                this.fieldEle.checked = !!value;
                return;
            case 'image':
            case 'custom':
            case 'hidden':
                return;
            default:
                this.logger.error(`field rendering type ${this.fieldRendering} not implemented. Value not set to field ${this.name}`);
        }
    }
    /**
     * wire 'change' and 'changing' events.
     * Thanks to standardization, 'input' event now serves as 'changing'.
     * We used to use 'keyUp' earlier..
     * Also, value is available on all the elements including textarea and select
     * @returns
     */
    wireEvents() {
        switch (this.fieldRendering) {
            case 'text-field':
            case 'password':
            case 'text-area':
                //this.requiresValidation = true;
                //need to track changing as well as changed
                this.fieldEle.addEventListener('change', () => {
                    this.valueHasChanged(this.fieldEle.value);
                });
                this.fieldEle.addEventListener('input', () => {
                    this.valueIsChanging(this.fieldEle.value);
                });
                return;
            case 'select':
                //only changed
                this.fieldEle.addEventListener('change', () => {
                    const ele = this.fieldEle;
                    this.valueHasChanged(ele.options[ele.selectedIndex].value);
                });
                return;
            case 'check-box':
                //we check for checked attribute and not value for check-box
                this.fieldEle.addEventListener('change', () => {
                    this.valueHasChanged('' + this.fieldEle.checked);
                });
                return;
            case 'output':
            case 'select-output':
            case 'image':
            case 'custom':
            case 'hidden':
                return;
            default:
                this.logger.error(`field rendering type ${this.fieldRendering} not implemented. Value not set to field ${this.name}`);
        }
    }
    valueIsChanging(newValue) {
        if (this.comp.onBeingChanged) {
            this.pc.act(this.comp.onBeingChanged, this.fc, { value: newValue });
        }
        /**
         * we will design this when we have enough inputs about how to handle various scenarios
         *
         */
    }
    valueHasChanged(newValue) {
        this.textValue = newValue.trim();
        const wasOk = this.valueIsValid;
        const oldValue = this.value;
        const isOk = this.validate();
        if (!this.fc) {
            //this is not controlled...
            return;
        }
        if (this.comp.onChange) {
            this.pc.act(this.comp.onChange, this.fc, { value: newValue });
        }
        const newValidity = wasOk ? undefined : isOk;
        if (oldValue !== this.value) {
            //events are wired only if dc is present
            this.fc.valueHasChanged(this.name, this.value, newValidity);
        }
        this.fc.eventOccurred({
            eventName: 'change',
            viewName: this.name,
            view: this,
            fc: this.fc,
            newValue: this.value,
            newValidity,
        });
    }
    /**
     * forces a validation for this field.
     * error status of the field is set before returning the validation result
     * @returns
     */
    validate() {
        let msgs;
        if (!this.textValue) {
            this.value = '';
            if (this.comp.isRequired) {
                msgs = [this.createMessage(simplity_types_1.systemMessages._valueRequired)];
            }
        }
        else {
            const vs = this.comp.valueSchema;
            const r = vs
                ? this.ac.validateValue(vs, this.textValue)
                : this.ac.validateType(this.comp.valueType, this.textValue);
            //set the values
            if (r.value !== undefined) {
                this.value = r.value;
                this.textValue = r.value + '';
            }
            else {
                /*
                 * entered value is invalid. We retain textValue to the entered value
                 * set value='', as if the value is "not-entered" by the UX
                 */
                this.value = '';
                //this.textValue will remain as what was typed!!
            }
            if (r.messages) {
                msgs = [];
                for (const msg of r.messages) {
                    msgs.push(this.createMessage(msg.messageId, msg.params));
                }
            }
        }
        if (msgs) {
            this.setAlerts(msgs);
            this.valueIsValid = false;
            return false;
        }
        this.resetAlerts();
        this.valueIsValid = false;
        return true;
    }
    createMessage(id, params) {
        const text = this.ac.getMessage(id, params) || id;
        return { id, text, type: 'error', fieldName: this.name };
    }
    getDefaultValue() {
        const text = this.comp.defaultValue;
        if (!text) {
            return ['', ''];
        }
        const vs = this.comp.valueSchema;
        const r = vs
            ? this.ac.validateValue(vs, text)
            : this.ac.validateType(this.comp.valueType, text);
        if (r.messages) {
            this.logger.warn(`Field ${this.name} has an invalid default value of ${text}. Value ignored`);
            return ['', ''];
        }
        return [r.value, '' + r.value];
    }
    getValue() {
        return this.value;
    }
    getSelectValue(value) {
        if (this.list) {
            for (const pair of this.list) {
                if (pair.value == value) {
                    return pair.label;
                }
            }
        }
        return '';
    }
    /**
     * alerts associated with this field are to be reset
     */
    resetAlerts() {
        this.setError(undefined);
    }
    /**
     * show an error message for this field
     */
    setAlerts(messages) {
        let text = '';
        for (const msg of messages) {
            if (text) {
                text += ';\n' + msg.text;
            }
            else {
                text = msg.text;
            }
        }
        this.setError(text);
    }
    isValid() {
        return this.valueIsValid;
    }
    /**
     * page controller uses this method to push the list for a drop-down
     * @param list list of valid options. This is set by page data service
     */
    setList(list) {
        this.list = list;
        if (!this.fieldEle) {
            return;
        }
        htmlUtil_1.htmlUtil.removeChildren(this.fieldEle);
        const sel = this.fieldEle;
        const option = document.createElement('option');
        if (!this.comp.isRequired) {
            //add an empty option
            const op = option.cloneNode(true);
            op.innerText = 'Select A Value';
            sel.appendChild(op);
        }
        let gotSelected = false;
        let firstOption;
        for (const pair of list) {
            const opt = option.cloneNode(true);
            if (!firstOption) {
                firstOption = opt;
            }
            const val = pair.value.toString();
            opt.setAttribute('value', val);
            if (this.textValue === val) {
                opt.setAttribute('selected', '');
                gotSelected = true;
            }
            opt.innerText = pair.label;
            sel.appendChild(opt);
        }
        if (this.comp.isRequired && gotSelected === false && firstOption) {
            //either this.value is undefined or is not valid
            const val = list[0].value;
            firstOption.setAttribute('selected', '');
            this.valueHasChanged(val.toString());
        }
    }
    setValueToSelect(value) {
        const ele = this.fieldEle;
        let idx = ele.selectedIndex;
        if (idx >= 0) {
            ele.options[idx].removeAttribute('selected');
        }
        for (const opt of ele.options) {
            if (opt.value === value) {
                opt.setAttribute('selected', '');
                return;
            }
        }
        /**
         * we have a situation where the value being set is not available as an option.
         * This is generally the case when the value is set before the options are set.
         * Two design alternatives:
         * 1. add an option with this value and select it
         * 2. do not do anything. Let the rendering be in limbo with no options being selected.
         * In practice, this situation gets resolved automatically once the options are set to the select element
         * Hence we are going with the second alternative.
         */
    }
    able(enabled) {
        if (this.isDisabled === !enabled) {
            return;
        }
        this.isDisabled = !this.isDisabled;
        if (this.fieldEle) {
            //no harm in using the attribute even if it has no meaning for that element
            if (enabled) {
                this.fieldEle.setAttribute('disabled', 'disabled');
            }
            else {
                this.fieldEle.removeAttribute('disabled');
            }
        }
    }
    setError(text) {
        if (!text) {
            if (!this.errorMessage) {
                return;
            }
            this.errorMessage = '';
            if (this.errorEle) {
                this.errorEle.innerText = '';
                this.errorEle.removeAttribute('data-error');
                return;
            }
            this.setDataAttr('error', undefined);
            return;
        }
        if (this.errorMessage) {
            this.errorMessage += ';\n' + text;
        }
        else {
            this.errorMessage = text;
        }
        if (this.errorEle) {
            this.errorEle.innerText = text;
            this.errorEle.setAttribute('data-error', text);
        }
        else {
            this.logger.info(`field ${this.name} is invalid with an error message="${this.errorMessage}". The field rendering has no provision to show error message`);
            this.setDataAttr('data-error', text);
        }
    }
}
exports.FieldElement = FieldElement;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmllbGRFbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9odG1sL2ZpZWxkRWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtREFTd0I7QUFDeEIsK0NBQTRDO0FBQzVDLHlDQUFzQztBQUV0QyxNQUFNLGFBQWEsR0FBcUIsQ0FBQyxRQUFRLEVBQUUsZUFBZSxDQUFDLENBQUM7QUFDcEU7Ozs7R0FJRztBQUNILE1BQWEsWUFBYSxTQUFRLHlCQUFXO0lBNkQzQzs7T0FFRztJQUNILFlBQ0UsRUFBOEIsRUFDZCxJQUFlLEVBQy9CLEtBQWEsRUFDYixRQUFrQjtRQUVsQixLQUFLLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFKZixTQUFJLEdBQUosSUFBSSxDQUFXO1FBakVqQzs7Ozs7OztXQU9HO1FBQ0ssY0FBUyxHQUFXLEVBQUUsQ0FBQztRQUUvQjs7OztXQUlHO1FBQ0ssVUFBSyxHQUFVLEVBQUUsQ0FBQztRQUVsQixpQkFBWSxHQUFZLElBQUksQ0FBQztRQUVyQzs7V0FFRztRQUNLLGlCQUFZLEdBQVcsRUFBRSxDQUFDO1FBRWxDOzs7V0FHRztRQUNILG9DQUFvQztRQUVwQzs7V0FFRztRQUNLLGVBQVUsR0FBWSxLQUFLLENBQUM7UUFFcEM7O1dBRUc7UUFDSCxxQkFBcUI7UUFDckIsMkJBQTJCO1FBQzNCOzs7V0FHRztRQUNLLFNBQUksR0FBZSxFQUFFLENBQUM7UUFhdEIsbUJBQWMsR0FBbUIsUUFBUSxDQUFDO1FBYWhELElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1FBQ3RCLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUVwQyxJQUFJLENBQUMsUUFBUSxHQUFHLG1CQUFRLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFFLENBQUM7UUFDOUQ7O1dBRUc7UUFDSCxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDUixJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDN0MsQ0FBQztRQUNEOztXQUVHO1FBQ0gsSUFBSSxRQUFRLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQzlCLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDdkIsSUFBSSxDQUFDLFFBQVEsR0FBRyxTQUFTLENBQUM7UUFDNUIsQ0FBQztRQUVELElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFOUMsSUFBSSxhQUFhLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUMxRCxJQUFJLENBQUMsUUFBUSxHQUFHLG1CQUFRLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNsRSxDQUFDO1FBRUQsNkRBQTZEO1FBQzdELElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQ3hCLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdkIsQ0FBQzthQUFNLENBQUM7WUFDTixDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUN0RCxJQUFJLElBQUksQ0FBQyxLQUFLLEtBQUssRUFBRSxJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDakMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDakQsQ0FBQztRQUNILENBQUM7UUFFRCxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNyQixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNqQyxDQUFDO1FBRUQsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO0lBQ3BCLENBQUM7SUFFTSxRQUFRLENBQUMsS0FBWTtRQUMxQixJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUN4QixLQUFLLEdBQUcsRUFBRSxDQUFDO1FBQ2IsQ0FBQztRQUVELElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ25CLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM5QixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztRQUN0QixRQUFRLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUM1QixLQUFLLFlBQVksQ0FBQztZQUNsQixLQUFLLFVBQVUsQ0FBQztZQUNoQixLQUFLLFdBQVc7Z0JBQ2IsSUFBSSxDQUFDLFFBQTZCLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztnQkFDakQsT0FBTztZQUVULEtBQUssUUFBUTtnQkFDWCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzVCLE9BQU87WUFFVCxLQUFLLFFBQVE7Z0JBQ1gsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO2dCQUMvQixPQUFPO1lBRVQsS0FBSyxlQUFlO2dCQUNsQixJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNwRCxPQUFPO1lBRVQsS0FBSyxXQUFXO2dCQUNiLElBQUksQ0FBQyxRQUE2QixDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDO2dCQUN0RCxPQUFPO1lBRVQsS0FBSyxPQUFPLENBQUM7WUFDYixLQUFLLFFBQVEsQ0FBQztZQUNkLEtBQUssUUFBUTtnQkFDWCxPQUFPO1lBRVQ7Z0JBQ0UsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQ2Ysd0JBQXdCLElBQUksQ0FBQyxjQUFjLDRDQUE0QyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQ25HLENBQUM7UUFDTixDQUFDO0lBQ0gsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNLLFVBQVU7UUFDaEIsUUFBUSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDNUIsS0FBSyxZQUFZLENBQUM7WUFDbEIsS0FBSyxVQUFVLENBQUM7WUFDaEIsS0FBSyxXQUFXO2dCQUNkLGlDQUFpQztnQkFDakMsMkNBQTJDO2dCQUMzQyxJQUFJLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUU7b0JBQzVDLElBQUksQ0FBQyxlQUFlLENBQUUsSUFBSSxDQUFDLFFBQTZCLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2xFLENBQUMsQ0FBQyxDQUFDO2dCQUNILElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRTtvQkFDM0MsSUFBSSxDQUFDLGVBQWUsQ0FBRSxJQUFJLENBQUMsUUFBNkIsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDbEUsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsT0FBTztZQUVULEtBQUssUUFBUTtnQkFDWCxjQUFjO2dCQUNkLElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRTtvQkFDNUMsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFFBQTZCLENBQUM7b0JBQy9DLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzdELENBQUMsQ0FBQyxDQUFDO2dCQUNILE9BQU87WUFFVCxLQUFLLFdBQVc7Z0JBQ2QsNERBQTREO2dCQUM1RCxJQUFJLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUU7b0JBQzVDLElBQUksQ0FBQyxlQUFlLENBQ2xCLEVBQUUsR0FBSSxJQUFJLENBQUMsUUFBNkIsQ0FBQyxPQUFPLENBQ2pELENBQUM7Z0JBQ0osQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsT0FBTztZQUVULEtBQUssUUFBUSxDQUFDO1lBQ2QsS0FBSyxlQUFlLENBQUM7WUFDckIsS0FBSyxPQUFPLENBQUM7WUFDYixLQUFLLFFBQVEsQ0FBQztZQUNkLEtBQUssUUFBUTtnQkFDWCxPQUFPO1lBRVQ7Z0JBQ0UsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQ2Ysd0JBQXdCLElBQUksQ0FBQyxjQUFjLDRDQUE0QyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQ25HLENBQUM7UUFDTixDQUFDO0lBQ0gsQ0FBQztJQUVPLGVBQWUsQ0FBQyxRQUFnQjtRQUN0QyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDN0IsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ3RFLENBQUM7UUFFRDs7O1dBR0c7SUFDTCxDQUFDO0lBRU8sZUFBZSxDQUFDLFFBQWdCO1FBQ3RDLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ2pDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7UUFDaEMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUM1QixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7UUFFN0IsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNiLDJCQUEyQjtZQUMzQixPQUFPO1FBQ1QsQ0FBQztRQUVELElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUN2QixJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDaEUsQ0FBQztRQUVELE1BQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDN0MsSUFBSSxRQUFRLEtBQUssSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQzVCLHdDQUF3QztZQUN4QyxJQUFJLENBQUMsRUFBRyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDL0QsQ0FBQztRQUVELElBQUksQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDO1lBQ3BCLFNBQVMsRUFBRSxRQUFRO1lBQ25CLFFBQVEsRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNuQixJQUFJLEVBQUUsSUFBSTtZQUNWLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRTtZQUNYLFFBQVEsRUFBRSxJQUFJLENBQUMsS0FBSztZQUNwQixXQUFXO1NBQ1osQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7O09BSUc7SUFDSSxRQUFRO1FBQ2IsSUFBSSxJQUFtQyxDQUFDO1FBQ3hDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDcEIsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7WUFDaEIsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUN6QixJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLCtCQUFjLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztZQUM3RCxDQUFDO1FBQ0gsQ0FBQzthQUFNLENBQUM7WUFDTixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQztZQUNqQyxNQUFNLENBQUMsR0FBRyxFQUFFO2dCQUNWLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDM0MsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUU5RCxnQkFBZ0I7WUFDaEIsSUFBSSxDQUFDLENBQUMsS0FBSyxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUMxQixJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUM7Z0JBQ3JCLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7WUFDaEMsQ0FBQztpQkFBTSxDQUFDO2dCQUNOOzs7bUJBR0c7Z0JBQ0gsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7Z0JBQ2hCLGdEQUFnRDtZQUNsRCxDQUFDO1lBRUQsSUFBSSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2YsSUFBSSxHQUFHLEVBQUUsQ0FBQztnQkFDVixLQUFLLE1BQU0sR0FBRyxJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDN0IsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQzNELENBQUM7WUFDSCxDQUFDO1FBQ0gsQ0FBQztRQUVELElBQUksSUFBSSxFQUFFLENBQUM7WUFDVCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3JCLElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO1lBQzFCLE9BQU8sS0FBSyxDQUFDO1FBQ2YsQ0FBQztRQUVELElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUNuQixJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztRQUMxQixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFTyxhQUFhLENBQUMsRUFBVSxFQUFFLE1BQWlCO1FBQ2pELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDbEQsT0FBTyxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0lBQzNELENBQUM7SUFFTyxlQUFlO1FBQ3JCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDO1FBQ3BDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNWLE9BQU8sQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDbEIsQ0FBQztRQUVELE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO1FBQ2pDLE1BQU0sQ0FBQyxHQUFHLEVBQUU7WUFDVixDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQztZQUNqQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDcEQsSUFBSSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDZixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FDZCxTQUFTLElBQUksQ0FBQyxJQUFJLG9DQUFvQyxJQUFJLGlCQUFpQixDQUM1RSxDQUFDO1lBQ0YsT0FBTyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNsQixDQUFDO1FBQ0QsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFNLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNsQyxDQUFDO0lBRUQsUUFBUTtRQUNOLE9BQU8sSUFBSSxDQUFDLEtBQU0sQ0FBQztJQUNyQixDQUFDO0lBRU8sY0FBYyxDQUFDLEtBQWE7UUFDbEMsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDZCxLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDN0IsSUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLEtBQUssRUFBRSxDQUFDO29CQUN4QixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7Z0JBQ3BCLENBQUM7WUFDSCxDQUFDO1FBQ0gsQ0FBQztRQUNELE9BQU8sRUFBRSxDQUFDO0lBQ1osQ0FBQztJQUVEOztPQUVHO0lBQ0ksV0FBVztRQUNoQixJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQzNCLENBQUM7SUFFRDs7T0FFRztJQUNJLFNBQVMsQ0FBQyxRQUEyQjtRQUMxQyxJQUFJLElBQUksR0FBRyxFQUFFLENBQUM7UUFDZCxLQUFLLE1BQU0sR0FBRyxJQUFJLFFBQVEsRUFBRSxDQUFDO1lBQzNCLElBQUksSUFBSSxFQUFFLENBQUM7Z0JBQ1QsSUFBSSxJQUFJLEtBQUssR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDO1lBQzNCLENBQUM7aUJBQU0sQ0FBQztnQkFDTixJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQztZQUNsQixDQUFDO1FBQ0gsQ0FBQztRQUNELElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdEIsQ0FBQztJQUVNLE9BQU87UUFDWixPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7SUFDM0IsQ0FBQztJQUVEOzs7T0FHRztJQUNJLE9BQU8sQ0FBQyxJQUFnQjtRQUM3QixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ25CLE9BQU87UUFDVCxDQUFDO1FBRUQsbUJBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxRQUE2QixDQUFDO1FBQy9DLE1BQU0sTUFBTSxHQUFzQixRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ25FLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQzFCLHFCQUFxQjtZQUNyQixNQUFNLEVBQUUsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBc0IsQ0FBQztZQUN2RCxFQUFFLENBQUMsU0FBUyxHQUFHLGdCQUFnQixDQUFDO1lBQ2hDLEdBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDdEIsQ0FBQztRQUVELElBQUksV0FBVyxHQUFHLEtBQUssQ0FBQztRQUN4QixJQUFJLFdBQTBDLENBQUM7UUFDL0MsS0FBSyxNQUFNLElBQUksSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUN4QixNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBc0IsQ0FBQztZQUN4RCxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ2pCLFdBQVcsR0FBRyxHQUFHLENBQUM7WUFDcEIsQ0FBQztZQUNELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDbEMsR0FBRyxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDL0IsSUFBSSxJQUFJLENBQUMsU0FBUyxLQUFLLEdBQUcsRUFBRSxDQUFDO2dCQUMzQixHQUFHLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDakMsV0FBVyxHQUFHLElBQUksQ0FBQztZQUNyQixDQUFDO1lBQ0QsR0FBRyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzNCLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdkIsQ0FBQztRQUVELElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLElBQUksV0FBVyxLQUFLLEtBQUssSUFBSSxXQUFXLEVBQUUsQ0FBQztZQUNqRSxnREFBZ0Q7WUFDaEQsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUMxQixXQUFXLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN6QyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7SUFDSCxDQUFDO0lBRU8sZ0JBQWdCLENBQUMsS0FBYTtRQUNwQyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsUUFBNkIsQ0FBQztRQUMvQyxJQUFJLEdBQUcsR0FBRyxHQUFHLENBQUMsYUFBYSxDQUFDO1FBQzVCLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ2IsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDL0MsQ0FBQztRQUVELEtBQUssTUFBTSxHQUFHLElBQUksR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzlCLElBQUksR0FBRyxDQUFDLEtBQUssS0FBSyxLQUFLLEVBQUUsQ0FBQztnQkFDeEIsR0FBRyxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2pDLE9BQU87WUFDVCxDQUFDO1FBQ0gsQ0FBQztRQUNEOzs7Ozs7OztXQVFHO0lBQ0wsQ0FBQztJQUVNLElBQUksQ0FBQyxPQUFnQjtRQUMxQixJQUFJLElBQUksQ0FBQyxVQUFVLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNqQyxPQUFPO1FBQ1QsQ0FBQztRQUNELElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ25DLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2xCLDJFQUEyRTtZQUMzRSxJQUFJLE9BQU8sRUFBRSxDQUFDO2dCQUNaLElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNyRCxDQUFDO2lCQUFNLENBQUM7Z0JBQ04sSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDNUMsQ0FBQztRQUNILENBQUM7SUFDSCxDQUFDO0lBRVMsUUFBUSxDQUFDLElBQXdCO1FBQ3pDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNWLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ3ZCLE9BQU87WUFDVCxDQUFDO1lBQ0QsSUFBSSxDQUFDLFlBQVksR0FBRyxFQUFFLENBQUM7WUFDdkIsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2xCLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQzVDLE9BQU87WUFDVCxDQUFDO1lBQ0QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDckMsT0FBTztRQUNULENBQUM7UUFFRCxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUN0QixJQUFJLENBQUMsWUFBWSxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUM7UUFDcEMsQ0FBQzthQUFNLENBQUM7WUFDTixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztRQUMzQixDQUFDO1FBQ0QsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDbEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1lBQy9CLElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNqRCxDQUFDO2FBQU0sQ0FBQztZQUNOLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUNkLFNBQVMsSUFBSSxDQUFDLElBQUksc0NBQXNDLElBQUksQ0FBQyxZQUFZLCtEQUErRCxDQUN6SSxDQUFDO1lBQ0YsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDdkMsQ0FBQztJQUNILENBQUM7Q0FDRjtBQS9kRCxvQ0ErZEMifQ==