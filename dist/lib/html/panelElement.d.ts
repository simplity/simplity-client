import { FormController, Panel } from 'simplity-types';
import { BaseElement } from './baseElement';
export declare class PanelElement extends BaseElement {
    readonly panel: Panel;
    private readonly contentEle;
    /**
     * in case this panel is associated with a child-form
     */
    readonly childFc?: FormController;
    constructor(fc: FormController | undefined, panel: Panel);
}
