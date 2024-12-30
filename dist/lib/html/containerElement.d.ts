import { BaseComponent, FormController, NbrCols } from 'simplity-types';
import { BaseElement } from './baseElement';
export declare class ContainerElement extends BaseElement {
    constructor(fc: FormController | undefined, comp: BaseComponent, templateName: string, maxWidth: NbrCols);
}
