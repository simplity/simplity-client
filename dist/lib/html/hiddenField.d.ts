import { DataField, FormController, Value } from 'simplity-types';
import { BaseElement } from './baseElement';
export declare class HiddenField extends BaseElement {
    readonly field: DataField;
    constructor(fc: FormController | undefined, field: DataField, maxWidth: number, value?: Value);
    private getDefaultValue;
}
