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
    if (ras === 'hidden') {
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
            case 'hidden':
                return;
                this.logger.error(`Design Error: FieldElement class should not have been used for rendering type ${this.fieldRendering}. Value not set to field ${this.name}`);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmllbGRFbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9odG1sL2ZpZWxkRWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtREFVd0I7QUFDeEIsK0NBQTRDO0FBQzVDLHlDQUFtRTtBQUNuRSx5REFBd0Q7QUFFeEQsU0FBUyxlQUFlLENBQUMsS0FBZ0I7SUFDdkMsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQztJQUMzQixJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDVCxPQUFPLFlBQVksQ0FBQztJQUN0QixDQUFDO0lBQ0QsSUFBSSxHQUFHLEtBQUssUUFBUSxFQUFFLENBQUM7UUFDckIsT0FBTyxFQUFFLENBQUM7SUFDWixDQUFDO0lBRUQsSUFBSSxHQUFHLEtBQUssWUFBWSxJQUFJLEtBQUssQ0FBQyxTQUFTLEtBQUssTUFBTSxFQUFFLENBQUM7UUFDdkQsT0FBTyxZQUFZLENBQUM7SUFDdEIsQ0FBQztJQUNELE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxNQUFhLFlBQWEsU0FBUSx5QkFBVztJQWlFM0M7O09BRUc7SUFDSCxZQUNFLEVBQThCLEVBQ2QsS0FBZ0IsRUFDaEMsUUFBZ0IsRUFDaEIsWUFBb0I7UUFFcEIsS0FBSyxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsZUFBZSxDQUFDLEtBQUssQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBSm5DLFVBQUssR0FBTCxLQUFLLENBQVc7UUFyRWxDOzs7Ozs7O1dBT0c7UUFDSyxjQUFTLEdBQVcsRUFBRSxDQUFDO1FBRS9COzs7OztXQUtHO1FBQ0ssVUFBSyxHQUFVLEVBQUUsQ0FBQztRQUVsQixpQkFBWSxHQUFZLElBQUksQ0FBQztRQUVyQzs7V0FFRztRQUNLLGlCQUFZLEdBQVcsRUFBRSxDQUFDO1FBRWxDOzs7V0FHRztRQUNILG9DQUFvQztRQUVwQzs7V0FFRztRQUNL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