import { DataField, DetailedMessage, FieldView, SimpleList, Value, FormController, Values } from 'simplity-types';
import { BaseElement } from './baseElement';
/**
 * Field is an element that has to render the value that it is given at run time.
 * Input fields allow the user to enter/alter the value.
 * This is the base class for all the fields.
 */
export declare class FieldElement extends BaseElement implements FieldView {
    readonly field: DataField;
    /**
     * we have implemented only HTMl client as of now.
     * value being string fits that quite well.
     *
     * only check-box requires a boolean as of now.
     * Once we implement date-pickers, we may change our mind!!!
     * Also, the last thing we want the end-user to see in a text-field is '#undefined'
     */
    private textValue;
    /**
     * value as seen by the external world.
     * It contains either a valid value, or an empty string.
     * if the entered value is invalid, say a numeric field has a textValue of "abcd", this field is ""
     * this approach is to avoid having undefined as a value.
     */
    private value;
    private valueIsValid;
    /**
     * '' if this field is valid.
     */
    private errorMessage;
    /**
     * used only to temporarily hide the field.
     * permanently hidden fields are never rendered.
     */
    /**
     * temporarily disabled. disabled fields should not be rendered as input fields
     */
    private isDisabled;
    /**
     * 0-based row number, in case this field is rendered as a column in a table-row
     */
    /**
     * relevant if this field has a drop-down list associated with it.
     * fds ensures that this list has the right value always
     */
    private list;
    /**
     * true if this is an editable field that requires validation.
     * output field and check-box do not require validation
     */
    /**
     * instantiated only for input fields.
     */
    private errorEle?;
    private fieldRendering?;
    /**
     * super.fieldEle is optional. Asserted value set to this local attribute for convenience
     */
    private readonly fldEle;
    /**
     * to be called from the concrete class after rendering itself in the constructor
     */
    constructor(fc: FormController | undefined, field: DataField, maxWidth: number, initialValue?: Value);
    resetValue(): void;
    setValue(newValue: Value): void;
    private renderFormattedOutput;
    /**
     * wire 'change' and 'changing' events.
     * Thanks to standardization, 'input' event now serves as 'changing'.
     * We used to use 'keyUp' earlier..
     * Also, value is available on all the elements including textarea and select
     * @returns
     */
    private wireEvents;
    valueIsChanging(newValue: string): void;
    valueHasChanged(newValue: string): void;
    /**
     * forces a validation for this field.
     * error status of the field is set before returning the validation result
     * @returns
     */
    validate(): boolean;
    private createMessage;
    private getDefaultValue;
    getValue(): Value;
    private getSelectValue;
    /**
     * alerts associated with this field are to be reset.
     */
    resetAlerts(): void;
    /**
     * show an error message for this field
     * typically when there is an error message from the server for this field
     */
    setAlerts(messages: DetailedMessage[]): void;
    isValid(): boolean;
    /**
     * page controller uses this method to push the list for a drop-down
     * @param list list of valid options. This is set by page data service
     */
    setList(list: SimpleList): void;
    private setEmpty;
    able(enabled: boolean): void;
    setError(text: string | undefined): void;
    /**
     * overriding to apply disabled and valid states to the right elements
     * @param stateName
     * @param stateValue
     */
    setDisplayState(settings: Values): void;
}
