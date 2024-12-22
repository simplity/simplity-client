import { AppController, BaseComponent, BaseView, DisplaySettings, FormController, PageController } from 'simplity-types';
/**
 * Base class to be extended by all view components
 * As of now, it is NOT a WebComponent, but a controller that is bound to the root html element.
 * By making this the base class, we have kept the flexibility to refactor them to webComponents later
 * (This approach is similar to Material Design Components of Google.)
 *
 * click event is handled here, while change and changing is handled by the fieldElement
 */
export declare class BaseElement implements BaseView {
    readonly fc: FormController | undefined;
    readonly comp: BaseComponent;
    protected readonly logger: import("simplity-types").Logger;
    protected readonly ac: AppController;
    protected readonly pc: PageController;
    protected readonly inputEle?: HTMLInputElement;
    protected labelEle?: HTMLElement;
    readonly name: string;
    /**
     * root of the html element that this controller manages.
     */
    readonly root: HTMLElement;
    /**
     *
     * @param comp meta data for this view component
     * @param templateName to be used to create the HTML element. ignored if root is provided
     * @param template instance to be cloned as HTML element
     */
    constructor(fc: FormController | undefined, comp: BaseComponent, templateName?: string);
    /**
     * concrete classes should implement this if error is relevant
     * @param msg
     */
    protected setError(msg: unknown): void;
    setDisplay(settings: DisplaySettings): void;
    clicked(): void;
    /**
     *
     * @param attr name of the attribute, (without the data-prefix)
     * @param value undefined to remove the attribute. String, including empty string, to set the value
     * @returns
     */
    protected setDataAttr(attr: string, value: string | undefined): void;
}
