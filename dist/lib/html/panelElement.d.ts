import { FormController, Panel, PanelView, NbrCols } from 'simplity-types';
import { BaseElement } from './baseElement';
export declare class PanelElement extends BaseElement implements PanelView {
    readonly panel: Panel;
    /**
     * in case this panel is associated with a child-form
     */
    readonly childFc?: FormController;
    constructor(fc: FormController | undefined, panel: Panel, maxWidth: NbrCols);
}
