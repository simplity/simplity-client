import { BaseComponent, Value, FormController } from 'simplity-types';
import { BaseElement } from './baseElement';
export declare const elementFactory: {
    /**
     * returns an instance of the right view component, or throws an error
     * @param comp
     * @param value used as the initial value if this is a field
     * @param isColumn if true, label is not rendered for this element
     * @param isDisabled if true for a field, the field is rendered as disabled
     * @returns view-component instance
     * @throws Error in case the type of the supplied component is not recognized
     */
    newElement(fc: FormController | undefined, comp: BaseComponent, value?: Value, inColumn?: boolean): BaseElement;
};
