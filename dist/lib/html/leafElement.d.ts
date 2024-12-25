import { Button, DisplaySettings, FormController, StaticComp } from 'simplity-types';
import { BaseElement } from './baseElement';
/**
 * base class for elements and buttons. These are elements with no children.
 * These elements are allowed to be rendered inside a TablePanel, in which case we have to handle them with their rowId.
 * This base class handles that part.
 */
export declare class LeafElement extends BaseElement {
    table: StaticComp | Button;
    /**
     * to be called if this view component is to be available for any run-time changes lik enable/disable
     */
    constructor(fc: FormController | undefined, table: StaticComp | Button, inColumn?: boolean);
    setDisplay(settings: DisplaySettings): void;
}
