import { ButtonPanel, FormController } from 'simplity-types';
import { BaseElement } from './baseElement';
/**
 * button panel renders action buttons, typically at the bottom of a form
 * Current design is to use left, center and right partitions to render three types of buttons.
 * 1. buttons to go back on the left
 * 2. action buttons for this form in the center
 * 3. buttons that take you forward, like next step, on the right
 *
 * this is just a wrapper and is not a component. It's job is to render its child components
 */
export declare class ButtonPanelElement extends BaseElement {
    readonly panel: ButtonPanel;
    constructor(fc: FormController | undefined, panel: ButtonPanel, maxWidth: number);
}
