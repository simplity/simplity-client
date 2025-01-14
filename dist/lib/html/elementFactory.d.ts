import { BaseComponent, Value, FormController } from 'simplity-types';
import { BaseElement } from './baseElement';
export declare const elementFactory: {
    /**
     * returns an instance of the right view component, or throws an error
     * @param fc
     * @param comp
     * @param maxWidth max width units that the parent can accommodate. This is the actual width of the parent.
     * @param value used as the initial value if this is a field
     * @returns view-component instance
     * @throws Error in case the type of the supplied component is not recognized
     */
    newElement(fc: FormController | undefined, comp: BaseComponent, maxWidth: number, value?: Value): BaseElement;
};
