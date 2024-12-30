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
    constructor(fc, field, maxWidth, value) {
        super(fc, field, field.renderAs, maxWidth);
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
        //important to set the default value before wiring the events
        if (value !== undefined) {
            this.setValue(value);
        }
        this.wireEvents();
        if (value === undefined) {
            [this.value, this.textValue] = this.getDefaultValue();
            if (this.value !== '' && this.fc) {
                this.fc.valueHasChanged(this.name, this.value);
            }
        }
        if (field.listOptions) {
            this.setList(field.listOptions);
        }
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
        const isOk = this.validate();
        if (!this.fc) {
            //this is not controlled...
            return;
        }
        if (this.field.onChange) {
            this.pc.act(this.field.onChange, this.fc, { value: newValue });
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
        this.valueIsValid = false;
        return true;
    }
    createMessage(id, params) {
        const text = this.ac.getMessage(id, params) || id;
        return { id, text, type: 'error', fieldName: this.name };
    }
    getDefaultValue() {
        const text = this.field.defaultValue;
        if (!text) {
            return ['', ''];
        }
        const vs = this.field.valueSchema;
        const r = vs
            ? this.ac.validateValue(vs, text)
            : this.ac.validateType(this.field.valueType, text);
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
        if (!list || list.length === 0) {
            /**
             * this is a reset;
             */
            if (this.textValue) {
                /**
                 * this selection is no more valid/relevant
                 */
                this.value = '';
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
        firstOpt.innerText = '-- Select One --';
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
            if (v != this.value) {
                this.value = v;
                this.textValue = v.toString();
                this.valueHasChanged(this.textValue);
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmllbGRFbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9odG1sL2ZpZWxkRWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtREFVd0I7QUFDeEIsK0NBQTRDO0FBQzVDLHlDQUFzQztBQUV0QyxNQUFNLGFBQWEsR0FBcUIsQ0FBQyxRQUFRLEVBQUUsZUFBZSxDQUFDLENBQUM7QUFDcEU7Ozs7R0FJRztBQUNILE1BQWEsWUFBYSxTQUFRLHlCQUFXO0lBNEQzQzs7T0FFRztJQUNILFlBQ0UsRUFBOEIsRUFDZCxLQUFnQixFQUNoQyxRQUFpQixFQUNqQixLQUFhO1FBRWIsS0FBSyxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUozQixVQUFLLEdBQUwsS0FBSyxDQUFXO1FBaEVsQzs7Ozs7OztXQU9HO1FBQ0ssY0FBUyxHQUFXLEVBQUUsQ0FBQztRQUUvQjs7OztXQUlHO1FBQ0ssVUFBSyxHQUFVLEVBQUUsQ0FBQztRQUVsQixpQkFBWSxHQUFZLElBQUksQ0FBQztRQUVyQzs7V0FFRztRQUNLLGlCQUFZLEdBQVcsRUFBRSxDQUFDO1FBRWxDOzs7V0FHRztRQUNILG9DQUFvQztRQUVwQzs7V0FFRztRQUNLLGVBQVUsR0FBWSxLQUFLLENBQUM7UUFFcEM7O1dBRUc7UUFDSCxxQkFBcUI7UUFDckIsMkJBQTJCO1FBQzNCOzs7V0FHRztRQUNLLFNBQUksR0FBZSxFQUFFLENBQUM7UUFhdEIsbUJBQWMsR0FBbUIsUUFBUSxDQUFDO1FBYWhELElBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQztRQUVyQyxJQUFJLENBQUMsUUFBUSxHQUFHLG1CQUFRLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFFLENBQUM7UUFDOUQ7O1dBRUc7UUFDSCxJQUFJLENBQUMsRUFBRSxFQUFFLENB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