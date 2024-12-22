import { Value, ValueFormatter } from 'simplity-types';
export declare const htmlUtil: {
    /**
     * removes all children of an html element using child.remove() method
     */
    removeChildren: typeof removeChildren;
    /**
     * create a new instance of this template html element
     * @param name template name
     */
    newHtmlElement: typeof newHtmlElement;
    /**
     * templates are designed to have unique values for data-id within their innerHTML.
     * this function gets the element within the template with the specified id
     * for example in a text-field template, label element has data-id="label" while input element has data-id="input"
     * @param rootEle parent element
     * @param id to be returned
     * @returns element
     * @throws error in case the element is not found
     */
    getChildElement: typeof getChildElement;
    /**
     * templates are designed to have unique values for data-id within their innerHTML.
     * this function gets the element within the template with the specified id
     * for example in a text-field template, label element has data-id="label" while input element has data-id="input"
     * @param rootEle parent element
     * @param id to be returned
     * @returns element, or undefined if it is not found
     */
    getOptionalElement: typeof getOptionalElement;
    /**
     * append text to an html element
     * @param ele to which text is to be appended to
     * @param text text to be appended
     */
    appendText: typeof appendText;
    /**
     *
     * @param ele to which the icon is to be appended
     * @param icon name of image file, or htmlName.html
     * @param alt alt text to be added if it is an image
     */
    appendIcon: typeof appendIcon;
    /**
     * formats a field name as a label.
     * e.g. fieldName is converted as "Field Name"
     * @param fieldName field name to be formatted as a label
     */
    toLabel: typeof toLabel;
    /**
     * format the value for output as per specification
     * @param value
     * @param formatter
     * @returns formatted string
     */
    formatValue: typeof formatValue;
};
declare function getOptionalElement(rootEle: HTMLElement, id: string): HTMLElement | undefined;
declare function getChildElement(rootEle: HTMLElement, id: string): HTMLElement;
declare function newHtmlElement(name: string): HTMLElement;
declare function removeChildren(ele: HTMLElement): void;
declare function appendText(ele: HTMLElement, text: string): void;
declare function appendIcon(ele: HTMLElement, icon: string, alt?: string): void;
declare function toLabel(name: string): string;
declare function formatValue(value: Value, formatter: ValueFormatter): string;
export {};
