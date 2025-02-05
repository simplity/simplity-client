import { Button, FormController, StaticComp } from 'simplity-types';
import { BaseElement } from './baseElement';
/**
 * base class for elements and buttons. These are elements with no children.
 * These elements are allowed to be rendered inside a TablePanel, in which case we have to handle them with their rowId.
 * This base class handles that part.
 */
export declare class LeafElement extends BaseElement {
    comp: StaticComp | Button;
    constructor(fc: FormController | undefined, comp: StaticComp | Button, maxWidth: number);
}
