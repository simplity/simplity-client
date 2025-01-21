"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FieldElement = void 0;
const simplity_types_1 = require("simplity-types");
const baseElement_1 = require("./baseElement");
const htmlUtil_1 = require("./htmlUtil");
const validation_1 = require("../validation/validation");
function getTemplateName(field) {
    const name = field.renderAs;
    if (name === 'hidden' || name === 'custom') {
        return '';
    }
    if (name === 'text-field' && field.valueType === 'date') {
        return 'date-field';
    }
    return name;
}
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
    constructor(fc, field, maxWidth, initialValue) {
        super(fc, field, getTemplateName(field), maxWidth);
        this.field = field;
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
         * It contains either a valid value, or an empty string.
         * if the entered value is invalid, say a numeric field has a textValue of "abcd", this field is ""
         * this approach is to avoid having undefined as a value.
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
        this.fieldRendering = field.renderAs;
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
        if (maxWidth === 0 && this.labelEle) {
            this.labelEle.remove();
            this.labelEle = undefined;
        }
        this.fieldEle.setAttribute('name', field.name);
        if (NO_VALIDATION.indexOf(field.renderAs) === -1) {
            this.errorEle = htmlUtil_1.htmlUtil.getOptionalElement(this.root, 'error');
        }
        this.wireEvents();
        let val = initialValue;
        if (val === undefined) {
            val = this.getDefaultValue();
        }
        if (val !== undefined) {
            console.info(`Setting default value of ${val} to field ${this.name}`);
            this.setValue(val);
            if (this.fc) {
                this.fc.valueHasChanged(this.name, val);
            }
        }
        if (field.listOptions) {
            this.setList(field.listOptions);
        }
    }
    setValue(newValue) {
        if (newValue === undefined) {
            newValue = '';
        }
        this.value = newValue;
        const text = newValue.toString();
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
                this.fieldEle.checked = !!newValue;
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
        if (this.field.onBeingChanged) {
            this.pc.act(this.field.onBeingChanged, this.fc, { value: newValue });
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
        //validate() sets value to this.value after validation)
        const isOk = this.validate();
        //validation could modify the text value, in which we case we have to sync that with the view
        if (this.textValue && this.textValue !== newValue) {
            this.setValue(this.value);
        }
        if (this.field.onChange) {
            this.pc.act(this.field.onChange, this.fc, { value: newValue });
        }
        if (oldValue === this.value || !this.fc) {
            //value has not actually changed, or there is NO controller
            return;
        }
        /**
         * new validity is undefined if the validity is unchanged
         */
        const newValidity = wasOk === isOk ? undefined : isOk;
        this.fc.valueHasChanged(this.name, this.value, newValidity);
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
            if (this.field.isRequired) {
                msgs = [this.createMessage(simplity_types_1.systemResources.messages._valueRequired)];
            }
        }
        else {
            const vs = this.field.valueSchema;
            const r = vs
                ? this.ac.validateValue(vs, this.textValue)
                : this.ac.validateType(this.field.valueType, this.textValue);
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
        this.valueIsValid = true;
        return true;
    }
    createMessage(id, params) {
        const text = this.ac.getMessage(id, params) || id;
        return { id, text, type: 'error', fieldName: this.name };
    }
    getDefaultValue() {
        const text = this.field.defaultValue;
        if (!text) {
            return undefined;
        }
        return (0, validation_1.parseToValue)(text, this.field.valueType);
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
     * alerts associated with this field are to be reset.
     */
    resetAlerts() {
        this.setError(undefined);
    }
    /**
     * show an error message for this field
     * typically when there is an error message from the server for this field
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
        if (!list || list.length === 0) {
            /**
             * this is a reset;
             */
            if (this.textValue) {
                /**
                 * this selection is no more valid/relevant.
                 * simulate as if user changed this to ''
                 */
                this.valueHasChanged('');
            }
            return;
        }
        /**
         * render the options
         */
        const sel = this.fieldEle;
        const option = document.createElement('option');
        //add an empty option
        const firstOpt = option.cloneNode(true);
        firstOpt.value = '';
        firstOpt.innerText = '';
        if (this.field.isRequired) {
            firstOpt.disabled = true;
            firstOpt.hidden = true;
        }
        sel.appendChild(firstOpt);
        let gotSelected = false;
        for (const pair of list) {
            const opt = option.cloneNode(true);
            const val = pair.value.toString();
            opt.value = val;
            if (this.textValue === val) {
                opt.setAttribute('selected', '');
                gotSelected = true;
            }
            opt.innerText = pair.label;
            sel.appendChild(opt);
        }
        if (gotSelected) {
            return;
        }
        /**
         * if user has no choice but to select the only one option, why ask them to do that?
         */
        if (this.field.isRequired && list.length === 1) {
            sel.options[1].selected = true;
            const v = list[0].value;
            //        this.value = v;
            //        this.textValue = v.toString();
            this.valueHasChanged('' + v);
            return;
        }
        firstOpt.selected = true;
        /**
         * any existing value is not relevant anymore
         */
        if (this.textValue) {
            this.value = '';
            this.textValue = '';
            this.valueHasChanged('');
            return;
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
            this.setDisplayState('error', false);
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
            this.setDisplayState('error', true);
        }
    }
}
exports.FieldElement = FieldElement;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmllbGRFbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9odG1sL2ZpZWxkRWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtREFTd0I7QUFDeEIsK0NBQTRDO0FBQzVDLHlDQUF3RDtBQUN4RCx5REFBd0Q7QUFFeEQsU0FBUyxlQUFlLENBQUMsS0FBZ0I7SUFDdkMsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQztJQUM1QixJQUFJLElBQUksS0FBSyxRQUFRLElBQUksSUFBSSxLQUFLLFFBQVEsRUFBRSxDQUFDO1FBQzNDLE9BQU8sRUFBRSxDQUFDO0lBQ1osQ0FBQztJQUNELElBQUksSUFBSSxLQUFLLFlBQVksSUFBSSxLQUFLLENBQUMsU0FBUyxLQUFLLE1BQU0sRUFBRSxDQUFDO1FBQ3hELE9BQU8sWUFBWSxDQUFDO0lBQ3RCLENBQUM7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFDRCxNQUFNLGFBQWEsR0FBcUIsQ0FBQyxRQUFRLEVBQUUsZUFBZSxDQUFDLENBQUM7QUFDcEU7Ozs7R0FJRztBQUNILE1BQWEsWUFBYSxTQUFRLHlCQUFXO0lBNkQzQzs7T0FFRztJQUNILFlBQ0UsRUFBOEIsRUFDZCxLQUFnQixFQUNoQyxRQUFnQixFQUNoQixZQUFvQjtRQUVwQixLQUFLLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxlQUFlLENBQUMsS0FBSyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFKbkMsVUFBSyxHQUFMLEtBQUssQ0FBVztRQWpFbEM7Ozs7Ozs7V0FPRztRQUNLLGNBQVMsR0FBVyxFQUFFLENBQUM7UUFFL0I7Ozs7O1dBS0c7UUFDSyxVQUFLLEdBQVUsRUFBRSxDQUFDO1FBRWxCLGlCQUFZLEdBQVksSUFBSSxDQUFDO1FBRXJDOztXQUVHO1FBQ0ssaUJBQVksR0FBVyxFQUFFLENBQUM7UUFFbEM7OztXQUdHO1FBQ0gsb0NBQW9DO1FBRXBDOztXQUVHO1FBQ0ssZUFBVSxHQUFZLEtBQUssQ0FBQztRQUVwQzs7V0FFRztRQUNILHFCQUFxQjtRQUNyQiwyQkFBMkI7UUFDM0I7OztXQUdHO1FBQ0ssU0FBSSxHQUFlLEVBQUUsQ0FBQztRQWF0QixtQkFBYyxHQUFtQixRQUFRLENBQUM7UUFhaEQsSUFBSSxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDO1FBRXJDLElBQUksQ0FBQyxRQUFRLEdBQUcsbUJBQVEsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUUsQ0FBQztRQUM5RDs7V0FFRztRQUNILElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNSLElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUM3QyxDQUFDO1FBQ0Q7O1dBRUc7UUFDSCxJQUFJLFFBQVEsS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3BDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDdkIsSUFBSSxDQUFDLFFBQVEsR0FBRyxTQUFTLENBQUM7UUFDNUIsQ0FBQztRQUVELElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFL0MsSUFBSSxhQUFhLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQ2pELElBQUksQ0FBQyxRQUFRLEdBQUcsbUJBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ2xFLENBQUM7UUFFRCxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFFbEIsSUFBSSxHQUFHLEdBQUcsWUFBWSxDQUFDO1FBQ3ZCLElBQUksR0FBRyxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQ3RCLEdBQUcsR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDL0IsQ0FBQztRQUNELElBQUksR0FBRyxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQ3RCLE9BQU8sQ0FBQyxJQUFJLENBQUMsNEJBQTRCLEdBQUcsYUFBYSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUN0RSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ25CLElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNaLElBQUksQ0FBQyxFQUFFLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDMUMsQ0FBQztRQUNILENBQUM7UUFFRCxJQUFJLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUN0QixJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNsQyxDQUFDO0lBQ0gsQ0FBQztJQUVNLFFBQVEsQ0FBQyxRQUFlO1FBQzdCLElBQUksUUFBUSxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQzNCLFFBQVEsR0FBRyxFQUFFLENBQUM7UUFDaEIsQ0FBQztRQUVELElBQUksQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDO1FBQ3RCLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNqQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztRQUN0QixRQUFRLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUM1QixLQUFLLFlBQVksQ0FBQztZQUNsQixLQUFLLFVBQVUsQ0FBQztZQUNoQixLQUFLLFdBQVc7Z0JBQ2IsSUFBSSxDQUFDLFFBQTZCLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztnQkFDakQsT0FBTztZQUVULEtBQUssUUFBUTtnQkFDWCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzVCLE9BQU87WUFFVCxLQUFLLFFBQVE7Z0JBQ1gsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO2dCQUMvQixPQUFPO1lBRVQsS0FBSyxlQUFlO2dCQUNsQixJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNwRCxPQUFPO1lBRVQsS0FBSyxXQUFXO2dCQUNiLElBQUksQ0FBQyxRQUE2QixDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDO2dCQUN6RCxPQUFPO1lBRVQsS0FBSyxPQUFPLENBQUM7WUFDYixLQUFLLFFBQVEsQ0FBQztZQUNkLEtBQUssUUFBUTtnQkFDWCxPQUFPO1lBRVQ7Z0JBQ0UsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQ2Ysd0JBQXdCLElBQUksQ0FBQyxjQUFjLDRDQUE0QyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQ25HLENBQUM7UUFDTixDQUFDO0lBQ0gsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNLLFVBQVU7UUFDaEIsUUFBUSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDNUIsS0FBSyxZQUFZLENBQUM7WUFDbEIsS0FBSyxVQUFVLENBQUM7WUFDaEIsS0FBSyxXQUFXO2dCQUNkLGlDQUFpQztnQkFDakMsMkNBQTJDO2dCQUMzQyxJQUFJLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUU7b0JBQzVDLElBQUksQ0FBQyxlQUFlLENBQUUsSUFBSSxDQUFDLFFBQTZCLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2xFLENBQUMsQ0FBQyxDQUFDO2dCQUNILElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRTtvQkFDM0MsSUFBSSxDQUFDLGVBQWUsQ0FBRSxJQUFJLENBQUMsUUFBNkIsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDbEUsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsT0FBTztZQUVULEtBQUssUUFBUTtnQkFDWCxjQUFjO2dCQUNkLElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRTtvQkFDNUMsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFFBQTZCLENBQUM7b0JBQy9DLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzdELENBQUMsQ0FBQyxDQUFDO2dCQUNILE9BQU87WUFFVCxLQUFLLFdBQVc7Z0JBQ2QsNERBQTREO2dCQUM1RCxJQUFJLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUU7b0JBQzVDLElBQUksQ0FBQyxlQUFlLENBQ2xCLEVBQUUsR0FBSSxJQUFJLENBQUMsUUFBNkIsQ0FBQyxPQUFPLENBQ2pELENBQUM7Z0JBQ0osQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsT0FBTztZQUVULEtBQUssUUFBUSxDQUFDO1lBQ2QsS0FBSyxlQUFlLENBQUM7WUFDckIsS0FBSyxPQUFPLENBQUM7WUFDYixLQUFLLFFBQVEsQ0FBQztZQUNkLEtBQUssUUFBUTtnQkFDWCxPQUFPO1lBRVQ7Z0JBQ0UsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQ2Ysd0JBQXdCLElBQUksQ0FBQyxjQUFjLDRDQUE0QyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQ25HLENBQUM7UUFDTixDQUFDO0lBQ0gsQ0FBQztJQUVPLGVBQWUsQ0FBQyxRQUFnQjtRQUN0QyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDOUIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZFLENBQUM7UUFFRDs7O1dBR0c7SUFDTCxDQUFDO0lBRU8sZUFBZSxDQUFDLFFBQWdCO1FBQ3RDLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ2pDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7UUFDaEMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUU1Qix1REFBdUQ7UUFDdkQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBRTdCLDZGQUE2RjtRQUM3RixJQUFJLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLFNBQVMsS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUNsRCxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM1QixDQUFDO1FBQ0QsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3hCLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUNqRSxDQUFDO1FBRUQsSUFBSSxRQUFRLEtBQUssSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUN4QywyREFBMkQ7WUFDM0QsT0FBTztRQUNULENBQUM7UUFFRDs7V0FFRztRQUNILE1BQU0sV0FBVyxHQUFHLEtBQUssS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQ3RELElBQUksQ0FBQyxFQUFFLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQztRQUU1RCxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQztZQUNwQixTQUFTLEVBQUUsUUFBUTtZQUNuQixRQUFRLEVBQUUsSUFBSSxDQUFDLElBQUk7WUFDbkIsSUFBSSxFQUFFLElBQUk7WUFDVixFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUU7WUFDWCxRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUs7WUFDcEIsV0FBVztTQUNaLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRDs7OztPQUlHO0lBQ0ksUUFBUTtRQUNiLElBQUksSUFBbUMsQ0FBQztRQUN4QyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ3BCLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO1lBQ2hCLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDMUIsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxnQ0FBZSxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO1lBQ3ZFLENBQUM7UUFDSCxDQUFDO2FBQU0sQ0FBQztZQUNOLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxHQUFHLEVBQUU7Z0JBQ1YsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUMzQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRS9ELGdCQUFnQjtZQUNoQixJQUFJLENBQUMsQ0FBQyxLQUFLLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQzFCLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQztnQkFDckIsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztZQUNoQyxDQUFDO2lCQUFNLENBQUM7Z0JBQ047OzttQkFHRztnQkFDSCxJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztnQkFDaEIsZ0RBQWdEO1lBQ2xELENBQUM7WUFFRCxJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDZixJQUFJLEdBQUcsRUFBRSxDQUFDO2dCQUNWLEtBQUssTUFBTSxHQUFHLElBQUksQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUM3QixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDM0QsQ0FBQztZQUNILENBQUM7UUFDSCxDQUFDO1FBRUQsSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUNULElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDckIsSUFBSSxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUM7WUFDMUIsT0FBTyxLQUFLLENBQUM7UUFDZixDQUFDO1FBRUQsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ25CLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO1FBQ3pCLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVPLGFBQWEsQ0FBQyxFQUFVLEVBQUUsTUFBaUI7UUFDakQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNsRCxPQUFPLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDM0QsQ0FBQztJQUVPLGVBQWU7UUFDckIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUM7UUFDckMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ1YsT0FBTyxTQUFTLENBQUM7UUFDbkIsQ0FBQztRQUNELE9BQU8sSUFBQSx5QkFBWSxFQUFDLElBQUksRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ2xELENBQUM7SUFFRCxRQUFRO1FBQ04sT0FBTyxJQUFJLENBQUMsS0FBTSxDQUFDO0lBQ3JCLENBQUM7SUFFTyxjQUFjLENBQUMsS0FBYTtRQUNsQyxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNkLEtBQUssTUFBTSxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUM3QixJQUFJLElBQUksQ0FBQyxLQUFLLElBQUksS0FBSyxFQUFFLENBQUM7b0JBQ3hCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztnQkFDcEIsQ0FBQztZQUNILENBQUM7UUFDSCxDQUFDO1FBQ0QsT0FBTyxFQUFFLENBQUM7SUFDWixDQUFDO0lBRUQ7O09BRUc7SUFDSSxXQUFXO1FBQ2hCLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDM0IsQ0FBQztJQUVEOzs7T0FHRztJQUNJLFNBQVMsQ0FBQyxRQUEyQjtRQUMxQyxJQUFJLElBQUksR0FBRyxFQUFFLENBQUM7UUFDZCxLQUFLLE1BQU0sR0FBRyxJQUFJLFFBQVEsRUFBRSxDQUFDO1lBQzNCLElBQUksSUFBSSxFQUFFLENBQUM7Z0JBQ1QsSUFBSSxJQUFJLEtBQUssR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDO1lBQzNCLENBQUM7aUJBQU0sQ0FBQztnQkFDTixJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQztZQUNsQixDQUFDO1FBQ0gsQ0FBQztRQUNELElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdEIsQ0FBQztJQUVNLE9BQU87UUFDWixPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7SUFDM0IsQ0FBQztJQUVEOzs7T0FHRztJQUNJLE9BQU8sQ0FBQyxJQUFnQjtRQUM3QixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUVqQixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ25CLE9BQU87UUFDVCxDQUFDO1FBRUQsbUJBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRXZDLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUMvQjs7ZUFFRztZQUNILElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNuQjs7O21CQUdHO2dCQUNILElBQUksQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDM0IsQ0FBQztZQUNELE9BQU87UUFDVCxDQUFDO1FBRUQ7O1dBRUc7UUFDSCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsUUFBNkIsQ0FBQztRQUMvQyxNQUFNLE1BQU0sR0FBc0IsUUFBUSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVuRSxxQkFBcUI7UUFDckIsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQXNCLENBQUM7UUFDN0QsUUFBUSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7UUFDcEIsUUFBUSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7UUFDeEIsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQzFCLFFBQVEsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1lBQ3pCLFFBQVEsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO1FBQ3pCLENBQUM7UUFDRCxHQUFHLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRTFCLElBQUksV0FBVyxHQUFHLEtBQUssQ0FBQztRQUN4QixLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUksRUFBRSxDQUFDO1lBQ3hCLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFzQixDQUFDO1lBQ3hELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDbEMsR0FBRyxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUM7WUFDaEIsSUFBSSxJQUFJLENBQUMsU0FBUyxLQUFLLEdBQUcsRUFBRSxDQUFDO2dCQUMzQixHQUFHLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDakMsV0FBVyxHQUFHLElBQUksQ0FBQztZQUNyQixDQUFDO1lBQ0QsR0FBRyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzNCLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdkIsQ0FBQztRQUVELElBQUksV0FBVyxFQUFFLENBQUM7WUFDaEIsT0FBTztRQUNULENBQUM7UUFFRDs7V0FFRztRQUNILElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUMvQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7WUFDL0IsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUN4Qix5QkFBeUI7WUFDekIsd0NBQXdDO1lBQ3hDLElBQUksQ0FBQyxlQUFlLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBRTdCLE9BQU87UUFDVCxDQUFDO1FBRUQsUUFBUSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7UUFDekI7O1dBRUc7UUFDSCxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNuQixJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztZQUNoQixJQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztZQUNwQixJQUFJLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3pCLE9BQU87UUFDVCxDQUFDO0lBQ0gsQ0FBQztJQUVPLGdCQUFnQixDQUFDLEtBQWE7UUFDcEMsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFFBQTZCLENBQUM7UUFDL0MsSUFBSSxHQUFHLEdBQUcsR0FBRyxDQUFDLGFBQWEsQ0FBQztRQUM1QixJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUNiLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQy9DLENBQUM7UUFFRCxLQUFLLE1BQU0sR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUM5QixJQUFJLEdBQUcsQ0FBQyxLQUFLLEtBQUssS0FBSyxFQUFFLENBQUM7Z0JBQ3hCLEdBQUcsQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNqQyxPQUFPO1lBQ1QsQ0FBQztRQUNILENBQUM7UUFDRDs7Ozs7Ozs7V0FRRztJQUNMLENBQUM7SUFFTSxJQUFJLENBQUMsT0FBZ0I7UUFDMUIsSUFBSSxJQUFJLENBQUMsVUFBVSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDakMsT0FBTztRQUNULENBQUM7UUFDRCxJQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQztRQUNuQyxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNsQiwyRUFBMkU7WUFDM0UsSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDWixJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDckQsQ0FBQztpQkFBTSxDQUFDO2dCQUNOLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzVDLENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztJQUVNLFFBQVEsQ0FBQyxJQUF3QjtRQUN0QyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDVixJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUN2QixPQUFPO1lBQ1QsQ0FBQztZQUNELElBQUksQ0FBQyxZQUFZLEdBQUcsRUFBRSxDQUFDO1lBQ3ZCLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNsQixJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7Z0JBQzdCLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUM1QyxPQUFPO1lBQ1QsQ0FBQztZQUNELElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3JDLE9BQU87UUFDVCxDQUFDO1FBRUQsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDdEIsSUFBSSxDQUFDLFlBQVksSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDO1FBQ3BDLENBQUM7YUFBTSxDQUFDO1lBQ04sSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7UUFDM0IsQ0FBQztRQUNELElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2xCLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztZQUMvQixJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDakQsQ0FBQzthQUFNLENBQUM7WUFDTixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FDZCxTQUFTLElBQUksQ0FBQyxJQUFJLHNDQUFzQyxJQUFJLENBQUMsWUFBWSwrREFBK0QsQ0FDekksQ0FBQztZQUNGLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3RDLENBQUM7SUFDSCxDQUFDO0NBQ0Y7QUFyZ0JELG9DQXFnQkMifQ==