import {
  DataField,
  DetailedMessage,
  FieldView,
  SimpleList,
  systemResources,
  Value,
  FormController,
  Values,
} from 'simplity-types';
import { BaseElement } from './baseElement';
import { HtmlTemplateName, htmlUtil, ViewState } from './htmlUtil';
import { parseValue } from '../validation/validation';

function getTemplateName(field: DataField): HtmlTemplateName | '' {
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
export class FieldElement extends BaseElement implements FieldView {
  /**
   * we have implemented only HTMl client as of now.
   * value being string fits that quite well.
   *
   * only check-box requires a boolean as of now.
   * Once we implement date-pickers, we may change our mind!!!
   * Also, the last thing we want the end-user to see in a text-field is '#undefined'
   */
  private textValue: string = '';

  /**
   * value as seen by the external world.
   * It contains either a valid value, or an empty string.
   * if the entered value is invalid, say a numeric field has a textValue of "abcd", this field is ""
   * this approach is to avoid having undefined as a value.
   */
  private value: Value = '';

  private valueIsValid: boolean = true;

  /**
   * '' if this field is valid.
   */
  private errorMessage: string = '';

  /**
   * used only to temporarily hide the field.
   * permanently hidden fields are never rendered.
   */
  //private isHidden: boolean = false;

  /**
   * temporarily disabled. disabled fields should not be rendered as input fields
   */
  private isDisabled: boolean = false;

  /**
   * 0-based row number, in case this field is rendered as a column in a table-row
   */
  //private rowId = -1;
  //private isColumn = false;
  /**
   * relevant if this field has a drop-down list associated with it.
   * fds ensures that this list has the right value always
   */
  private list: SimpleList = [];

  /**
   * true if this is an editable field that requires validation.
   * output field and check-box do not require validation
   */
  //private requiresValidation: boolean = true;

  /**
   * instantiated only for input fields.
   */
  private errorEle?: HTMLElement;
  private fieldRendering?;

  /**
   * super.fieldEle is optional. Asserted value set to this local attribute for convenience
   */
  private readonly fldEle: HTMLElement;

  /**
   * to be called from the concrete class after rendering itself in the constructor
   */
  constructor(
    fc: FormController | undefined,
    public readonly field: DataField,
    maxWidth: number,
    initialValue?: Value
  ) {
    super(fc, field, getTemplateName(field), maxWidth);
    if (!this.fieldEle) {
      throw new Error(
        `HTML template :'${getTemplateName(field)}' - data-id="field" missing for the target element for the field. e.g. <input data-id="field"...../>`
      );
    }
    this.fldEle = this.fieldEle;
    this.fieldRendering = field.renderAs || 'text-field';

    /**
     * uncontrolled fields are to be disabled. Typically in a table-row
     */
    if (!fc) {
      this.fldEle.setAttribute('disabled', '');
    }
    /**
     * no labels inside grids
     */
    if (maxWidth === 0 && this.labelEle) {
      this.labelEle.remove();
      this.labelEle = undefined;
    }

    this.fldEle.setAttribute('name', field.name);

    this.errorEle = htmlUtil.getOptionalElement(this.root, 'error');

    this.wireEvents();

    if (field.listOptions) {
      this.setList(field.listOptions);
    }

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
  }

  public resetValue() {
    let value = this.getDefaultValue();
    if (value === undefined) {
      value = '';
    }
    this.setValue(value);
  }

  public setValue(newValue: Value): void {
    if (newValue === undefined) {
      newValue = '';
    }

    this.value = newValue;
    const text = newValue.toString();
    this.textValue = text;
    switch (this.fieldRendering) {
      case undefined:
      case 'text-field':
      case 'password':
      case 'text-area':
      case 'select':
        (this.fldEle as HTMLInputElement | HTMLSelectElement).value = text;
        this.setEmpty(text === '');
        return;

      case 'output':
        this.fldEle.innerText = text;
        return;

      case 'select-output':
        this.fldEle.innerText = this.getSelectValue(text);
        return;

      case 'check-box':
        (this.fldEle as HTMLInputElement).checked = !!newValue;
        return;

      case 'image':
      case 'hidden':
        return;

        this.logger.error(
          `Design Error: FieldElement class should not have been used for rendering type ${this.fieldRendering}. Value not set to field ${this.name}`
        );
        return;

      default:
        this.logger.error(
          `field rendering type ${this.fieldRendering} not implemented. Value not set to field ${this.name}`
        );
    }
  }

  /**
   * wire 'change' and 'changing' events.
   * Thanks to standardization, 'input' event now serves as 'changing'.
   * We used to use 'keyUp' earlier..
   * Also, value is available on all the elements including textarea and select
   * @returns
   */
  private wireEvents(): void {
    switch (this.fieldRendering) {
      case undefined:
      case 'text-field':
      case 'password':
      case 'text-area':
      case 'select':
        //this.requiresValidation = true;
        //need to track changing as well as changed
        this.fldEle.addEventListener('change', () => {
          this.valueHasChanged((this.fldEle as HTMLInputElement).value);
        });

        //for select, input does not trigger, and we are fine with that
        this.fldEle.addEventListener('input', () => {
          this.valueIsChanging((this.fldEle as HTMLInputElement).value);
        });
        return;

      case 'check-box':
        //we check for checked attribute and not value for check-box
        this.fldEle.addEventListener('change', () => {
          this.valueHasChanged('' + (this.fldEle as HTMLInputElement).checked);
        });
        return;

      case 'output':
      case 'select-output':
      case 'image':
      case 'hidden':
        return;

      default:
        this.logger.error(
          `field rendering type ${this.fieldRendering} not implemented. Value not set to field ${this.name}`
        );
    }
  }

  public valueIsChanging(newValue: string) {
    if (this.field.onBeingChanged) {
      this.pc.act(this.field.onBeingChanged, this.fc, { value: newValue });
    }

    /**
     * we will design this when we have enough inputs about how to handle various scenarios
     *
     */
  }

  public valueHasChanged(newValue: string) {
    this.textValue = newValue.trim();
    this.setEmpty(!this.textValue);
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

    console.log(
      `Value of ${this.name} has changed with oldValue='${oldValue}', newValue='${this.value}', wasOk='${wasOk}' isOk = '${isOk}' this.fc:`,
      this.fc
    );
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
  public validate(): boolean {
    let msgs: DetailedMessage[] | undefined;
    if (!this.textValue) {
      this.value = '';
      if (this.field.isRequired) {
        msgs = [this.createMessage(systemResources.messages._valueRequired)];
      }
    } else {
      const vs = this.field.valueSchema;
      const r = vs
        ? this.ac.validateValue(vs, this.textValue)
        : this.ac.validateType(this.field.valueType, this.textValue);

      //set the values
      if (r.value !== undefined) {
        this.value = r.value;
        this.textValue = r.value + '';
      } else {
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

  private createMessage(id: string, params?: string[]): DetailedMessage {
    const text = this.ac.getMessage(id, params) || id;
    return { id, text, type: 'error', fieldName: this.name };
  }

  private getDefaultValue(): Value | undefined {
    const text = this.field.defaultValue;
    if (!text) {
      return undefined;
    }
    return parseValue(text, this.field.valueType);
  }

  public getValue(): Value {
    return this.value!;
  }

  private getSelectValue(value: string) {
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
  public resetAlerts(): void {
    this.setError(undefined);
  }

  /**
   * show an error message for this field
   * typically when there is an error message from the server for this field
   */
  public setAlerts(messages: DetailedMessage[]): void {
    let text = '';
    for (const msg of messages) {
      if (text) {
        text += ';\n' + msg.text;
      } else {
        text = msg.text;
      }
    }
    this.setError(text);
  }

  public isValid(): boolean {
    return this.valueIsValid;
  }

  /**
   * page controller uses this method to push the list for a drop-down
   * @param list list of valid options. This is set by page data service
   */
  public setList(list: SimpleList): void {
    this.list = list;

    htmlUtil.removeChildren(this.fldEle);
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
    const sel = this.fldEle as HTMLSelectElement;
    const option: HTMLOptionElement = document.createElement('option');

    //add an empty option
    const firstOpt = option.cloneNode(true) as HTMLOptionElement;
    firstOpt.value = '';
    firstOpt.innerText = '';
    if (this.field.isRequired) {
      firstOpt.disabled = true;
      firstOpt.hidden = true;
    }
    sel.appendChild(firstOpt);

    let gotSelected = false;
    for (const pair of list) {
      const opt = option.cloneNode(true) as HTMLOptionElement;
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

  private setEmpty(isEmpty: boolean): void {
    htmlUtil.setViewState(this.fldEle, 'empty', isEmpty);
  }

  public able(enabled: boolean) {
    if (this.isDisabled === !enabled) {
      return;
    }
    this.isDisabled = !this.isDisabled;
    if (this.fldEle) {
      //no harm in using the attribute even if it has no meaning for that element
      if (enabled) {
        this.fldEle.setAttribute('disabled', 'disabled');
      } else {
        this.fldEle.removeAttribute('disabled');
      }
    }
  }

  public setError(text: string | undefined): void {
    if (!text) {
      //is not in error
      if (!this.errorMessage) {
        //was not in error
        return;
      }
      this.errorMessage = '';
      if (this.errorEle) {
        this.errorEle.innerText = '';
        htmlUtil.setViewState(this.errorEle, 'invalid', false);
      }
      htmlUtil.setViewState(this.fldEle, 'invalid', false);
      return;
    }

    if (this.errorMessage) {
      this.errorMessage += ';\n' + text;
    } else {
      this.errorMessage = text;
    }
    if (this.errorEle) {
      this.errorEle.innerText = text;
      htmlUtil.setViewState(this.errorEle, 'invalid', true);
    } else {
      this.logger.info(
        `field ${this.name} is invalid with an error message="${this.errorMessage}". The field rendering has no provision to show error message`
      );
    }
    htmlUtil.setViewState(this.fldEle, 'invalid', true);
  }

  /**
   * overriding to apply disabled and valid states to the right elements
   * @param stateName
   * @param stateValue
   */
  setDisplayState(settings: Values): void {
    let setting: ViewState = 'invalid';
    let val = settings[setting];
    if (val !== undefined) {
      htmlUtil.setViewState(this.fldEle!, setting, !!val);
      if (this.errorEle) {
        htmlUtil.setViewState(this.errorEle, setting, !!val);
      }
      delete settings[setting];
    }
    setting = 'disabled';
    val = settings[setting];
    if (val !== undefined) {
      htmlUtil.setViewState(this.root, setting, !!val);
      delete settings[setting];
    }
    super.setDisplayState(settings);
  }
}
