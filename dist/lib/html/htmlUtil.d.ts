import { Value, ValueFormatter } from 'simplity-types';
/**
 * display states that are designed by simplity
 */
declare const viewStates: {
    /**
     * clickable: some action will be triggered on click-of this element
     */
    readonly clickable: "boolean";
    /**
     * a row can be "selected", may be an item can be "selected"
     */
    readonly selectable: "boolean";
    /**
     * true/false. Generally used for input fields.
     * However, we should be able to use it for wrapper elements that contain input fields
     */
    readonly disabled: "boolean";
    /**
     * used by the template to mark that the element would like to set its width to all it can
     */
    readonly full: "boolean";
    /**
     * id is meant for the template to identify sub-elements
     * e.g. data-id="row" for a tr element etc..
     */
    readonly id: "string";
    /**
     * generally meant for input field, but may be used for a wrapper that contain input fields
     */
    readonly invalid: "boolean";
    /**
     * index of the element within its parent array.
     * e.g. for a tr-element, this is the idx into the data-array that this tr is rendering from
     */
    readonly idx: "number";
    /**
     * true/false to show/hide an element
     */
    readonly hidden: "boolean";
    /**
     * width of this element as per column-width design for this app.
     * for example, in a standard grid-layout design, full-width is 12.
     *
     */
    readonly width: "number";
    /**
     * initialization function for this element
     */
    readonly init: "string";
    /**
     * change alignment at run time. like right-align for numbers in a table-column
     */
    readonly align: "string";
    /**
     * how a column in a table is sorted.
     * 'asc' or 'desc'
     */
    readonly sorted: "string";
    /**
     * whether a select element is empty. Used to the label positioning
     */
    readonly empty: "boolean";
};
export type ViewState = keyof typeof viewStates;
/**
 * to be used only by design-time utilities to check if all the required templates are supplied or not
 */
export declare const predefinedHtmlTemplates: readonly ["button", "button-panel", "check-box", "content", "date-field", "dialog", "disable-ux", "image-field", "image", "layout", "line", "list", "module", "menu-item", "message", "output", "page", "panel", "panel-flex", "panel-grid", "panel-modal", "password", "select-output", "select", "snack-bar", "sortable-header", "tab", "table-editable", "table", "tabs", "text-area", "text-field"];
export type HtmlTemplateName = (typeof predefinedHtmlTemplates)[number];
/**
 * data-* attribute used by our app
 */
export declare const dataAttributeNames: readonly ["full", "id"];
export declare const childElementIds: readonly ["add-button", "buttons", "data", "container", "error", "field", "full", "header", "label", "left", "list-config", "menu-bar", "menu-item", "message", "middle", "page", "right", "row", "rows", "search", "table", "title"];
export type ChildElementId = (typeof childElementIds)[number];
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
     * create a new instance of an app-specific custom element that is not part of standard simplity library
     * @param name template name
     */
    newCustomElement: typeof newElement;
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
    /**
     * Set the View-state of this element to the desired value.
     *
     * @param ele
     * @param stateName  must be a valid name as per the design specification for the app
     *
     * @param value    value as per the design of this attribute.
     */
    setViewState: typeof setViewState;
    /**
     * get the value of a display state.
     * @returns undefined if the state is not set at all,
     *  true if the attribute is set, but with no value, or ="" or with the the name of the attribute itself
     * string otherwise
     */
    getViewState: typeof getViewState;
};
declare function getOptionalElement(rootEle: HTMLElement, id: ChildElementId): HTMLElement | undefined;
declare function getChildElement(rootEle: HTMLElement, id: ChildElementId): HTMLElement;
declare function newHtmlElement(name: HtmlTemplateName): HTMLElement;
declare function newElement(name: string): HTMLElement;
declare function removeChildren(ele: HTMLElement): void;
declare function appendText(ele: HTMLElement, text: string): void;
declare function appendIcon(ele: HTMLElement, icon: string, alt?: string): void;
declare function toLabel(name: string): string;
declare function formatValue(value: Value, formatter: ValueFormatter): string;
declare function getViewState(ele: HTMLElement, stateName: string): string | boolean | undefined;
declare function setViewState(ele: HTMLElement, stateName: ViewState, stateValue: Value): void;
export {};
