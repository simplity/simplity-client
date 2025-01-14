import { HtmlTemplateName } from './htmlUtil';
import { AppController, BaseComponent, BaseView, FormController, PageController } from 'simplity-types';
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
    /**
     * width of the parent in number of columns.
     * 0 means this is inside a column of a row of a table
     */
    protected maxWidth: number;
    protected readonly logger: import("simplity-types").Logger;
    protected readonly ac: AppController;
    protected readonly pc: PageController;
    /**
     * If this is an input
     */
    protected readonly inputEle?: HTMLInputElement;
    protected labelEle?: HTMLElement;
    /**
     * if this is a container-type of element, like a panel, or tab
     */
    protected readonly containerEle?: HTMLElement;
    readonly name: string;
    /**
     * root of the html element that this controller manages.
     */
    readonly root: HTMLElement;
    /**
     *
     * @param table meta data for this view component
     * @param templateName to be used to create the HTML element. ignored if root is provided
     * @param template instance to be cloned as HTML element
     */
    constructor(fc: FormController | undefined, comp: BaseComponent, 
    /**
     * mandatory. comp.customHtml, if specified,  will override this.
     */
    templateName: HtmlTemplateName | '', 
    /**
     * width of the parent in number of columns.
     * 0 means this is inside a column of a row of a table
     */
    maxWidth: number);
    /**
     * concrete classes should implement this if error is relevant
     * @param msg
     */
    setError(msg: unknown): void;
    setDisplayState(stateName: string, stateValue: string | number | boolean): void;
    clicked(): void;
}
