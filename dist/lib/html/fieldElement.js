"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FieldElement = void 0;
const simplity_types_1 = require("simplity-types");
const baseElement_1 = require("./baseElement");
const htmlUtil_1 = require("./htmlUtil");
const validation_1 = require("../validation/validation");
function getTemplateName(field) {
    const ras = field.renderAs;
    if (!ras) {
        return 'text-field';
    }
    if (ras === 'hidden' || ras === 'custom') {
        return '';
    }
    if (ras === 'text-field' && field.valueType === 'date') {
        return 'date-field';
    }
    return ras;
}
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
        /**
         * is this a select (drop-down) element?
         */
        this.isSelect = false;
        if (field.renderAs) {
            this.fieldRendering = field.renderAs;
            this.isSelect = field.renderAs === 'select';
        }
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
        this.errorEle = htmlUtil_1.htmlUtil.getOptionalElement(this.root, 'error');
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
        if (this.isSelect) {
            this.setEmpty(!this.textValue);
        }
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
        this.setEmpty(true);
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
            this.setEmpty(false);
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
            this.setEmpty(false);
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
    setEmpty(isEmpty) {
        htmlUtil_1.htmlUtil.setViewState(this.fieldEle, 'empty', isEmpty);
    }
    setValueToSelect(value) {
        this.setEmpty(value !== '');
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
        this.setEmpty(value === '');
        console.info(`drop-down selected = ${value !== ''}`, this.fieldEle);
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
            //is not in error
            if (!this.errorMessage) {
                //was not in error
                return;
            }
            this.errorMessage = '';
            if (this.errorEle) {
                this.errorEle.innerText = '';
                htmlUtil_1.htmlUtil.setViewState(this.errorEle, 'invalid', false);
            }
            htmlUtil_1.htmlUtil.setViewState(this.fieldEle, 'invalid', false);
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
            htmlUtil_1.htmlUtil.setViewState(this.errorEle, 'invalid', true);
        }
        else {
            this.logger.info(`field ${this.name} is invalid with an error message="${this.errorMessage}". The field rendering has no provision to show error message`);
        }
        htmlUtil_1.htmlUtil.setViewState(this.fieldEle, 'invalid', true);
    }
    /**
     * overriding to apply disabled and valid states to teh right elements
     * @param stateName
     * @param stateValue
     */
    setDisplayState(settings) {
        let setting = 'invalid';
        let val = settings[setting];
        if (val !== undefined) {
            htmlUtil_1.htmlUtil.setViewState(this.fieldEle, setting, !!val);
            if (this.errorEle) {
                htmlUtil_1.htmlUtil.setViewState(this.errorEle, setting, !!val);
            }
            delete settings[setting];
        }
        setting = 'disabled';
        val = settings[setting];
        if (val !== undefined) {
            htmlUtil_1.htmlUtil.setViewState(this.root, setting, !!val);
            delete settings[setting];
        }
        super.setDisplayState(settings);
    }
}
exports.FieldElement = FieldElement;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmllbGRFbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9odG1sL2ZpZWxkRWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtREFVd0I7QUFDeEIsK0NBQTRDO0FBQzVDLHlDQUFtRTtBQUNuRSx5REFBd0Q7QUFFeEQsU0FBUyxlQUFlLENBQUMsS0FBZ0I7SUFDdkMsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQztJQUMzQixJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDVCxPQUFPLFlBQVksQ0FBQztJQUN0QixDQUFDO0lBQ0QsSUFBSSxHQUFHLEtBQUssUUFBUSxJQUFJLEdBQUcsS0FBSyxRQUFRLEVBQUUsQ0FBQztRQUN6QyxPQUFPLEVBQUUsQ0FBQztJQUNaLENBQUM7SUFFRCxJQUFJLEdBQUcsS0FBSyxZQUFZLElBQUksS0FBSyxDQUFDLFNBQVMsS0FBSyxNQUFNLEVBQUUsQ0FBQztRQUN2RCxPQUFPLFlBQVksQ0FBQztJQUN0QixDQUFDO0lBQ0QsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILE1BQWEsWUFBYSxTQUFRLHlCQUFXO0lBaUUzQzs7T0FFRztJQUNILFlBQ0UsRUFBOEIsRUFDZCxLQUFnQixFQUNoQyxRQUFnQixFQUNoQixZQUFvQjtRQUVwQixLQUFLLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxlQUFlLENBQUMsS0FBSyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFKbkMsVUFBSyxHQUFMLEtBQUssQ0FBVztRQXJFbEM7Ozs7Ozs7V0FPRztRQUNLLGNBQVMsR0FBVyxFQUFFLENBQUM7UUFFL0I7Ozs7O1dBS0c7UUFDSyxVQUFLLEdBQVUsRUFBRSxDQUFDO1FBRWxCLGlCQUFZLEdBQVksSUFBSSxDQUFDO1FBRXJDOztXQUVHO1FBQ0ssaUJBQVksR0FBVyxFQUFFLENBQUM7UUFFbEM7OztXQUdHO1FBQ0gsb0NBQW9DO1FBRXBDOztXQUVHO1FBQ0ssZUFBVSxHQUFZLEtBQUssQ0FBQztRQUVwQzs7V0FFRztRQUNILHFCQUFxQjtRQUNyQiwyQkFBMkI7UUFDM0I7OztXQUdHO1FBQ0ssU0FBSSxHQUFlLEVBQUUsQ0FBQztRQWF0QixtQkFBYyxHQUFtQixRQUFRLENBQUM7UUFFbEQ7O1dBRUc7UUFDSyxhQUFRLEdBQUcsS0FBSyxDQUFDO1FBWXZCLElBQUksS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ25CLElBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQztZQUNyQyxJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLEtBQUssUUFBUSxDQUFDO1FBQzlDLENBQUM7UUFFRCxJQUFJLENBQUMsUUFBUSxHQUFHLG1CQUFRLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFFLENBQUM7UUFDOUQ7O1dBRUc7UUFDSCxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDUixJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDN0MsQ0FBQztRQUNEOztXQUVHO1FBQ0gsSUFBSSxRQUFRLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNwQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxRQUFRLEdBQUcsU0FBUyxDQUFDO1FBQzVCLENBQUM7UUFFRCxJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRS9DLElBQUksQ0FBQyxRQUFRLEdBQUcsbUJBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBRWhFLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUVsQixJQUFJLEdBQUcsR0FBRyxZQUFZLENBQUM7UUFDdkIsSUFBSSxHQUFHLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDdEIsR0FBRyxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUMvQixDQUFDO1FBQ0QsSUFBSSxHQUFHLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDdEIsT0FBTyxDQUFDLElBQUksQ0FBQyw0QkFBNEIsR0FBRyxhQUFhLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ3RFLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDbkIsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ1osSUFBSSxDQUFDLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztZQUMxQyxDQUFDO1FBQ0gsQ0FBQztRQUVELElBQUksS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ2xDLENBQUM7SUFDSCxDQUFDO0lBRU0sUUFBUSxDQUFDLFFBQWU7UUFDN0IsSUFBSSxRQUFRLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDM0IsUUFBUSxHQUFHLEVBQUUsQ0FBQztRQUNoQixDQUFDO1FBRUQsSUFBSSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUM7UUFDdEIsTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ2pDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1FBQ3RCLFFBQVEsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQzVCLEtBQUssWUFBWSxDQUFDO1lBQ2xCLEtBQUssVUFBVSxDQUFDO1lBQ2hCLEtBQUssV0FBVztnQkFDYixJQUFJLENBQUMsUUFBNkIsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO2dCQUNqRCxPQUFPO1lBRVQsS0FBSyxRQUFRO2dCQUNYLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDNUIsT0FBTztZQUVULEtBQUssUUFBUTtnQkFDWCxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7Z0JBQy9CLE9BQU87WUFFVCxLQUFLLGVBQWU7Z0JBQ2xCLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3BELE9BQU87WUFFVCxLQUFLLFdBQVc7Z0JBQ2IsSUFBSSxDQUFDLFFBQTZCLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUM7Z0JBQ3pELE9BQU87WUFFVCxLQUFLLE9BQU8sQ0FBQztZQUNiLEtBQUssUUFBUSxDQUFDO1lBQ2QsS0FBSyxRQUFRO2dCQUNYLE9BQU87WUFFVDtnQkFDRSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FDZix3QkFBd0IsSUFBSSxDQUFDLGNBQWMsNENBQTRDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FDbkcsQ0FBQztRQUNOLENBQUM7SUFDSCxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0ssVUFBVTtRQUNoQixRQUFRLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUM1QixLQUFLLFlBQVksQ0FBQztZQUNsQixLQUFLLFVBQVUsQ0FBQztZQUNoQixLQUFLLFdBQVc7Z0JBQ2QsaUNBQWlDO2dCQUNqQywyQ0FBMkM7Z0JBQzNDLElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRTtvQkFDNUMsSUFBSSxDQUFDLGVBQWUsQ0FBRSxJQUFJLENBQUMsUUFBNkIsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDbEUsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsSUFBSSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFO29CQUMzQyxJQUFJLENBQUMsZUFBZSxDQUFFLElBQUksQ0FBQyxRQUE2QixDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNsRSxDQUFDLENBQUMsQ0FBQztnQkFDSCxPQUFPO1lBRVQsS0FBSyxRQUFRO2dCQUNYLGNBQWM7Z0JBQ2QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsR0FBRyxFQUFFO29CQUM1QyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsUUFBNkIsQ0FBQztvQkFDL0MsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDN0QsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsT0FBTztZQUVULEtBQUssV0FBVztnQkFDZCw0REFBNEQ7Z0JBQzVELElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRTtvQkFDNUMsSUFBSSxDQUFDLGVBQWUsQ0FDbEIsRUFBRSxHQUFJLElBQUksQ0FBQyxRQUE2QixDQUFDLE9BQU8sQ0FDakQsQ0FBQztnQkFDSixDQUFDLENBQUMsQ0FBQztnQkFDSCxPQUFPO1lBRVQsS0FBSyxRQUFRLENBQUM7WUFDZCxLQUFLLGVBQWUsQ0FBQztZQUNyQixLQUFLLE9BQU8sQ0FBQztZQUNiLEtBQUssUUFBUSxDQUFDO1lBQ2QsS0FBSyxRQUFRO2dCQUNYLE9BQU87WUFFVDtnQkFDRSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FDZix3QkFBd0IsSUFBSSxDQUFDLGNBQWMsNENBQTRDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FDbkcsQ0FBQztRQUNOLENBQUM7SUFDSCxDQUFDO0lBRU0sZUFBZSxDQUFDLFFBQWdCO1FBQ3JDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUM5QixJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDdkUsQ0FBQztRQUVEOzs7V0FHRztJQUNMLENBQUM7SUFFTSxlQUFlLENBQUMsUUFBZ0I7UUFDckMsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDakMsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDbEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNqQyxDQUFDO1FBQ0QsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQztRQUNoQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBRTVCLHVEQUF1RDtRQUN2RCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7UUFFN0IsNkZBQTZGO1FBQzdGLElBQUksSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsU0FBUyxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQ2xELElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzVCLENBQUM7UUFDRCxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDeEIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ2pFLENBQUM7UUFFRCxJQUFJLFFBQVEsS0FBSyxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3hDLDJEQUEyRDtZQUMzRCxPQUFPO1FBQ1QsQ0FBQztRQUVEOztXQUVHO1FBQ0gsTUFBTSxXQUFXLEdBQUcsS0FBSyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDdEQsSUFBSSxDQUFDLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBRTVELElBQUksQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDO1lBQ3BCLFNBQVMsRUFBRSxRQUFRO1lBQ25CLFFBQVEsRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNuQixJQUFJLEVBQUUsSUFBSTtZQUNWLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRTtZQUNYLFFBQVEsRUFBRSxJQUFJLENBQUMsS0FBSztZQUNwQixXQUFXO1NBQ1osQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7O09BSUc7SUFDSSxRQUFRO1FBQ2IsSUFBSSxJQUFtQyxDQUFDO1FBQ3hDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDcEIsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7WUFDaEIsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUMxQixJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGdDQUFlLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7WUFDdkUsQ0FBQztRQUNILENBQUM7YUFBTSxDQUFDO1lBQ04sTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUM7WUFDbEMsTUFBTSxDQUFDLEdBQUcsRUFBRTtnQkFDVixDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQzNDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFFL0QsZ0JBQWdCO1lBQ2hCLElBQUksQ0FBQyxDQUFDLEtBQUssS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDMUIsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDO2dCQUNyQixJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO1lBQ2hDLENBQUM7aUJBQU0sQ0FBQztnQkFDTjs7O21CQUdHO2dCQUNILElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO2dCQUNoQixnREFBZ0Q7WUFDbEQsQ0FBQztZQUVELElBQUksQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNmLElBQUksR0FBRyxFQUFFLENBQUM7Z0JBQ1YsS0FBSyxNQUFNLEdBQUcsSUFBSSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQzdCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUMzRCxDQUFDO1lBQ0gsQ0FBQztRQUNILENBQUM7UUFFRCxJQUFJLElBQUksRUFBRSxDQUFDO1lBQ1QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNyQixJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztZQUMxQixPQUFPLEtBQUssQ0FBQztRQUNmLENBQUM7UUFFRCxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDbkIsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7UUFDekIsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRU8sYUFBYSxDQUFDLEVBQVUsRUFBRSxNQUFpQjtRQUNqRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ2xELE9BQU8sRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUMzRCxDQUFDO0lBRU8sZUFBZTtRQUNyQixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQztRQUNyQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDVixPQUFPLFNBQVMsQ0FBQztRQUNuQixDQUFDO1FBQ0QsT0FBTyxJQUFBLHlCQUFZLEVBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDbEQsQ0FBQztJQUVNLFFBQVE7UUFDYixPQUFPLElBQUksQ0FBQyxLQUFNLENBQUM7SUFDckIsQ0FBQztJQUVPLGNBQWMsQ0FBQyxLQUFhO1FBQ2xDLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ2QsS0FBSyxNQUFNLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQzdCLElBQUksSUFBSSxDQUFDLEtBQUssSUFBSSxLQUFLLEVBQUUsQ0FBQztvQkFDeEIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO2dCQUNwQixDQUFDO1lBQ0gsQ0FBQztRQUNILENBQUM7UUFDRCxPQUFPLEVBQUUsQ0FBQztJQUNaLENBQUM7SUFFRDs7T0FFRztJQUNJLFdBQVc7UUFDaEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUMzQixDQUFDO0lBRUQ7OztPQUdHO0lBQ0ksU0FBUyxDQUFDLFFBQTJCO1FBQzFDLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNkLEtBQUssTUFBTSxHQUFHLElBQUksUUFBUSxFQUFFLENBQUM7WUFDM0IsSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDVCxJQUFJLElBQUksS0FBSyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDM0IsQ0FBQztpQkFBTSxDQUFDO2dCQUNOLElBQUksR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDO1lBQ2xCLENBQUM7UUFDSCxDQUFDO1FBQ0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN0QixDQUFDO0lBRU0sT0FBTztRQUNaLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztJQUMzQixDQUFDO0lBRUQ7OztPQUdHO0lBQ0ksT0FBTyxDQUFDLElBQWdCO1FBQzdCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBRWpCLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDbkIsT0FBTztRQUNULENBQUM7UUFFRCxtQkFBUSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdkMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwQixJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDL0I7O2VBRUc7WUFDSCxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDbkI7OzttQkFHRztnQkFDSCxJQUFJLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzNCLENBQUM7WUFDRCxPQUFPO1FBQ1QsQ0FBQztRQUVEOztXQUVHO1FBQ0gsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFFBQTZCLENBQUM7UUFDL0MsTUFBTSxNQUFNLEdBQXNCLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFbkUscUJBQXFCO1FBQ3JCLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFzQixDQUFDO1FBQzdELFFBQVEsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO1FBQ3BCLFFBQVEsQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO1FBQ3hCLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUMxQixRQUFRLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztZQUN6QixRQUFRLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztRQUN6QixDQUFDO1FBQ0QsR0FBRyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUUxQixJQUFJLFdBQVcsR0FBRyxLQUFLLENBQUM7UUFDeEIsS0FBSyxNQUFNLElBQUksSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUN4QixNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBc0IsQ0FBQztZQUN4RCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2xDLEdBQUcsQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDO1lBQ2hCLElBQUksSUFBSSxDQUFDLFNBQVMsS0FBSyxHQUFHLEVBQUUsQ0FBQztnQkFDM0IsR0FBRyxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2pDLFdBQVcsR0FBRyxJQUFJLENBQUM7WUFDckIsQ0FBQztZQUNELEdBQUcsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUMzQixHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZCLENBQUM7UUFFRCxJQUFJLFdBQVcsRUFBRSxDQUFDO1lBQ2hCLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDckIsT0FBTztRQUNULENBQUM7UUFFRDs7V0FFRztRQUNILElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUMvQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7WUFDL0IsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUN4Qix5QkFBeUI7WUFDekIsd0NBQXdDO1lBQ3hDLElBQUksQ0FBQyxlQUFlLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzdCLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFckIsT0FBTztRQUNULENBQUM7UUFFRCxRQUFRLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztRQUN6Qjs7V0FFRztRQUNILElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ25CLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO1lBQ2hCLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO1lBQ3BCLElBQUksQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDekIsT0FBTztRQUNULENBQUM7SUFDSCxDQUFDO0lBRU8sUUFBUSxDQUFDLE9BQWdCO1FBQy9CLG1CQUFRLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFDTyxnQkFBZ0IsQ0FBQyxLQUFhO1FBQ3BDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQzVCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxRQUE2QixDQUFDO1FBQy9DLElBQUksR0FBRyxHQUFHLEdBQUcsQ0FBQyxhQUFhLENBQUM7UUFDNUIsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDYixHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMvQyxDQUFDO1FBRUQsS0FBSyxNQUFNLEdBQUcsSUFBSSxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDOUIsSUFBSSxHQUFHLENBQUMsS0FBSyxLQUFLLEtBQUssRUFBRSxDQUFDO2dCQUN4QixHQUFHLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDakMsT0FBTztZQUNULENBQUM7UUFDSCxDQUFDO1FBQ0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDNUIsT0FBTyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsS0FBSyxLQUFLLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNwRTs7Ozs7Ozs7V0FRRztJQUNMLENBQUM7SUFFTSxJQUFJLENBQUMsT0FBZ0I7UUFDMUIsSUFBSSxJQUFJLENBQUMsVUFBVSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDakMsT0FBTztRQUNULENBQUM7UUFDRCxJQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQztRQUNuQyxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNsQiwyRUFBMkU7WUFDM0UsSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDWixJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDckQsQ0FBQztpQkFBTSxDQUFDO2dCQUNOLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzVDLENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztJQUVNLFFBQVEsQ0FBQyxJQUF3QjtRQUN0QyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDVixpQkFBaUI7WUFDakIsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDdkIsa0JBQWtCO2dCQUNsQixPQUFPO1lBQ1QsQ0FBQztZQUNELElBQUksQ0FBQyxZQUFZLEdBQUcsRUFBRSxDQUFDO1lBQ3ZCLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNsQixJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7Z0JBQzdCLG1CQUFRLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3pELENBQUM7WUFDRCxtQkFBUSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN2RCxPQUFPO1FBQ1QsQ0FBQztRQUVELElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxZQUFZLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQztRQUNwQyxDQUFDO2FBQU0sQ0FBQztZQUNOLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO1FBQzNCLENBQUM7UUFDRCxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNsQixJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7WUFDL0IsbUJBQVEsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDeEQsQ0FBQzthQUFNLENBQUM7WUFDTixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FDZCxTQUFTLElBQUksQ0FBQyxJQUFJLHNDQUFzQyxJQUFJLENBQUMsWUFBWSwrREFBK0QsQ0FDekksQ0FBQztRQUNKLENBQUM7UUFDRCxtQkFBUSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILGVBQWUsQ0FBQyxRQUFnQjtRQUM5QixJQUFJLE9BQU8sR0FBYyxTQUFTLENBQUM7UUFDbkMsSUFBSSxHQUFHLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzVCLElBQUksR0FBRyxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQ3RCLG1CQUFRLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxRQUFTLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN0RCxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDbEIsbUJBQVEsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3ZELENBQUM7WUFDRCxPQUFPLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMzQixDQUFDO1FBQ0QsT0FBTyxHQUFHLFVBQVUsQ0FBQztRQUNyQixHQUFHLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3hCLElBQUksR0FBRyxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQ3RCLG1CQUFRLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNqRCxPQUFPLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMzQixDQUFDO1FBQ0QsS0FBSyxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNsQyxDQUFDO0NBQ0Y7QUE5aUJELG9DQThpQkMifQ==