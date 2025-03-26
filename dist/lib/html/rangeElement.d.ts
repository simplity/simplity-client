import { FormController, RangePanel } from 'simplity-types';
import { BaseElement } from './baseElement';
import { FieldElement } from './fieldElement';
export declare class RangeElement extends BaseElement {
    readonly range: RangePanel;
    readonly fromView: FieldElement;
    readonly toView: FieldElement;
    constructor(fc: FormController | undefined, range: RangePanel, maxWidth: number);
}
