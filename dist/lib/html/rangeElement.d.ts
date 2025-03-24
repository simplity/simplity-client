import { FormController, RangePanel } from 'simplity-types';
import { BaseElement } from './baseElement';
export declare class RangeElement extends BaseElement {
    readonly range: RangePanel;
    constructor(fc: FormController | undefined, range: RangePanel, maxWidth: number);
}
