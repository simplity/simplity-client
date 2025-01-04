import {
  DataField,
  DetailedMessage,
  FieldView,
  FieldRendering,
  SimpleList,
  systemResources,
  Value,
  FormController,
  NbrCols,
} from 'simplity-types';
import { BaseElement } from './baseElement';
import { htmlUtil } from './htmlUtil';
import { parseToValue } from '../validation/validation';

const NO_VALIDATION: FieldRendering[] = ['output', 'select-output'];
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
   * if the entered value is invalid, say a numeric field has a textValue of "abcd", this field is ""
   * this approach is to avoid having undefined as a value, leaving that to detect "irrelevant" or "not-used" fields
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
  private fieldEle: HTMLElement;
  private errorEle?: HTMLElement;
  private fieldRendering: FieldRendering = 'hidden';

  /**
   * to be called from the concrete class after rendering itself in the constructor
   */
  constructor(
    fc: FormController | undefined,
    public readonly field: DataField,
    maxWidth: NbrCols,
    value?: Value
  ) {
    super(fc, field, field.renderAs, maxWidth);

    this.fieldRendering = field.renderAs;

    this.fieldEle = htmlUtil.getChildElement(this.root, 'field')!;
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
      this.errorEle = htmlUtil.getOptionalElement(this.root, 'error');
    }

    this.wireEvents();

    let val = value;
    if (val === undefined) {
      val = this.getDefaultValue();
    }
    if (val !== undefined) {
      this.setValue(val);
      if (this.fc) {
        this.fc.valueHasChanged(this.name, val);
      }
    }

    if (field.listOptions) {
      this.setList(field.listOptions);
    }
  }

  public setValue(value: Value): void {
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
        (this.fieldEle as HTMLInputElement).value = text;
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
        (this.fieldEle as HTMLInputElement).checked = !!value;
        return;

      case 'image':
      case 'custom':
      case 'hidden':
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
      case 'text-field':
      case 'password':
      case 'text-area':
        //this.requiresValidation = true;
        //need to track changing as well as changed
        this.fieldEle.addEventListener('change', () => {
          this.valueHasChanged((this.fieldEle as HTMLInputElement).value);
        });
        this.fieldEle.addEventListener('input', () => {
          this.valueIsChanging((this.fieldEle as HTMLInputElement).value);
        });
        return;

      case 'select':
        //only changed
        this.fieldEle.addEventListener('change', () => {
          const ele = this.fieldEle as HTMLSelectElement;
          this.valueHasChanged(ele.options[ele.selectedIndex].value);
        });
        return;

      case 'check-box':
        //we check for checked attribute and not value for check-box
        this.fieldEle.addEventListener('change', () => {
          this.valueHasChanged(
            '' + (this.fieldEle as HTMLInputElement).checked
          );
        });
        return;

      case 'output':
      case 'select-output':
      case 'image':
      case 'custom':
      case 'hidden':
        return;

      default:
        this.logger.error(
          `field rendering type ${this.fieldRendering} not implemented. Value not set to field ${this.name}`
        );
    }
  }

  private valueIsChanging(newValue: string) {
    if (this.field.onBeingChanged) {
      this.pc.act(this.field.onBeingChanged, this.fc, { value: newValue });
    }

    /**
     * we will design this when we have enough inputs about how to handle various scenarios
     *
     */
  }

  private valueHasChanged(newValue: string) {
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
      this.fc!.valueHasChanged(this.name, this.value, newValidity);
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
    this.valueIsValid = false;
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
    return parseToValue(text, this.field.valueType);
  }

  getValue(): Value {
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
   * alerts associated with this field are to be reset
   */
  public resetAlerts(): void {
    this.setError(undefined);
  }

  /**
   * show an error message for this field
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
    if (!this.fieldEle) {
      return;
    }

    htmlUtil.removeChildren(this.fieldEle);

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
    const sel = this.fieldEle as HTMLSelectElement;
    const option: HTMLOptionElement = document.createElement('option');

    //add an empty option
    const firstOpt = option.cloneNode(true) as HTMLOptionElement;
    firstOpt.value = '';
    firstOpt.innerText = '-- Select One --';
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

  private setValueToSelect(value: string) {
    const ele = this.fieldEle as HTMLSelectElement;
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

  public able(enabled: boolean) {
    if (this.isDisabled === !enabled) {
      return;
    }
    this.isDisabled = !this.isDisabled;
    if (this.fieldEle) {
      //no harm in using the attribute even if it has no meaning for that element
      if (enabled) {
        this.fieldEle.setAttribute('disabled', 'disabled');
      } else {
        this.fieldEle.removeAttribute('disabled');
      }
    }
  }

  protected setError(text: string | undefined): void {
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
    } else {
      this.errorMessage = text;
    }
    if (this.errorEle) {
      this.errorEle.innerText = text;
      this.errorEle.setAttribute('data-error', text);
    } else {
      this.logger.info(
        `field ${this.name} is invalid with an error message="${this.errorMessage}". The field rendering has no provision to show error message`
      );
      this.setDataAttr('data-error', text);
    }
  }
}
