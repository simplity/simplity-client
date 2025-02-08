"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.htmlUtil = exports.childElementIds = exports.dataAttributeNames = exports.predefinedHtmlTemplates = void 0;
const app_1 = require("../controller/app");
const logger_1 = require("../logger-stub/logger");
/**
 * display states that are designed by simplity
 */
const viewStates = {
    /**
     * clickable: some action will be triggered on click-of this element
     */
    clickable: 'boolean',
    /**
     * a row can be "selected", may be an item can be "selected"
     */
    selectable: 'boolean',
    /**
     * true/false. Generally used for input fields.
     * However, we should be able to use it for wrapper elements that contain input fields
     */
    disabled: 'boolean',
    /**
     * used by the template to mark that the element would like to set its width to all it can
     */
    full: 'boolean',
    /**
     * id is meant for the template to identify sub-elements
     * e.g. data-id="row" for a tr element etc..
     */
    id: 'string',
    /**
     * generally meant for input field, but may be used for a wrapper that contain input fields
     */
    invalid: 'boolean',
    /**
     * index of the element within its parent array.
     * e.g. for a tr-element, this is the idx into the data-array that this tr is rendering from
     */
    idx: 'number',
    /**
     * true/false to show/hide an element
     */
    hidden: 'boolean',
    /**
     * width of this element as per column-width design for this app.
     * for example, in a standard grid-layout design, full-width is 12.
     *
     */
    width: 'number',
    /**
     * initialization function for this element
     */
    init: 'string',
    /**
     * change alignment at run time. like right-align for numbers in a table-column
     */
    align: 'string',
    /**
     * how a column in a table is sorted.
     * 'asc' or 'desc'
     */
    sorted: 'string',
};
/**
 * to be used only by design-time utilities to check if all the required templates are supplied or not
 */
exports.predefinedHtmlTemplates = [
    'button',
    'button-panel',
    'check-box',
    'content',
    'date-field',
    'dialog',
    'disable-ux',
    'image-field',
    'image',
    'layout',
    'line',
    'list',
    'module',
    'menu-item',
    'message',
    'output',
    'page',
    'panel',
    'panel-flex',
    'panel-grid',
    'panel-modal',
    'password',
    'select-output',
    'select',
    'snack-bar',
    'sortable-header',
    'tab',
    'table-editable',
    'table',
    'tabs',
    'text-area',
    'text-field',
];
/**
 * data-* attribute used by our app
 */
exports.dataAttributeNames = ['full', 'id'];
exports.childElementIds = [
    'add-button',
    'buttons',
    'data',
    'container',
    'error',
    'field',
    'full',
    'header',
    'label',
    'left',
    'list-config',
    'menu-bar',
    'menu-item',
    'message',
    'middle',
    'page',
    'right',
    'row',
    'rows',
    'search',
    'table',
    'title',
];
/**
 * caching the templates that are already created
 */
const allTemplates = {};
const logger = logger_1.loggerStub.getLogger();
exports.htmlUtil = {
    /**
     * removes all children of an html element using child.remove() method
     */
    removeChildren,
    /**
     * create a new instance of this template html element
     * @param name template name
     */
    newHtmlElement,
    /**
     * create a new instance of an app-specific custom element that is not part of standard simplity library
     * @param name template name
     */
    newCustomElement: newElement,
    /**
     * templates are designed to have unique values for data-id within their innerHTML.
     * this function gets the element within the template with the specified id
     * for example in a text-field template, label element has data-id="label" while input element has data-id="input"
     * @param rootEle parent element
     * @param id to be returned
     * @returns element
     * @throws error in case the element is not found
     */
    getChildElement,
    /**
     * templates are designed to have unique values for data-id within their innerHTML.
     * this function gets the element within the template with the specified id
     * for example in a text-field template, label element has data-id="label" while input element has data-id="input"
     * @param rootEle parent element
     * @param id to be returned
     * @returns element, or undefined if it is not found
     */
    getOptionalElement,
    /**
     * append text to an html element
     * @param ele to which text is to be appended to
     * @param text text to be appended
     */
    appendText,
    /**
     *
     * @param ele to which the icon is to be appended
     * @param icon name of image file, or htmlName.html
     * @param alt alt text to be added if it is an image
     */
    appendIcon,
    /**
     * formats a field name as a label.
     * e.g. fieldName is converted as "Field Name"
     * @param fieldName field name to be formatted as a label
     */
    toLabel,
    /**
     * format the value for output as per specification
     * @param value
     * @param formatter
     * @returns formatted string
     */
    formatValue,
    /**
     * Set the View-state of this element to the desired value.
     *
     * @param ele
     * @param stateName  must be a valid name as per the design specification for the app
     *
     * @param value    value as per the design of this attribute.
     */
    setViewState,
    /**
     * get the value of a display state.
     * @returns undefined if the state is not set at all,
     *  true if the attribute is set, but with no value, or ="" or with the the name of the attribute itself
     * string otherwise
     */
    getViewState,
};
function getOptionalElement(rootEle, id) {
    const ele = rootEle.querySelector(`[data-id="${id}"]`);
    if (ele) {
        return ele;
    }
    const att = rootEle.getAttribute('data-id');
    if (id === att) {
        return rootEle;
    }
    return undefined;
}
function getChildElement(rootEle, id) {
    const ele = getOptionalElement(rootEle, id);
    if (ele) {
        return ele;
    }
    console.info(rootEle);
    throw new Error(`HTML Template does not contain a child element with data-id="${id}". This is required as a container to render a child component`);
}
function newHtmlElement(name) {
    return newElement('template-' + name);
}
function newElement(name) {
    let ele = allTemplates[name];
    if (!ele) {
        let html = app_1.app.getCurrentAc().getHtml(name);
        if (!html) {
            logger.warn(`A component requires an html-template named "${name}". This template is not available at run time. A dummy HTML is used.`);
            html = `<div><!-- html source ${name} not found --></div>`;
        }
        ele = toEle(html);
        allTemplates[name] = ele;
    }
    return ele.cloneNode(true);
}
function toEle(html) {
    const template = document.createElement('template');
    template.innerHTML = html;
    return template.content.firstElementChild;
}
function removeChildren(ele) {
    ele.innerHTML = '';
}
function appendText(ele, text) {
    ele.appendChild(document.createTextNode(text));
}
function appendIcon(ele, icon, alt) {
    if (icon.endsWith('.html')) {
        const s = icon.substring(0, icon.length - 5);
        const html = app_1.app.getCurrentAc().getHtml(s);
        if (html) {
            ele.appendChild(toEle(html));
            return;
        }
        logger.error(`an icon named ${icon} could not be created because no html is available with name ${s}`);
        return;
    }
    const img = document.createElement('img');
    img.alt = alt || '';
    img.src = app_1.app.getCurrentAc().getImageSrc(icon);
    ele.appendChild(img);
}
function toLabel(name) {
    if (!name) {
        return '';
    }
    const firstChar = name.charAt(0).toUpperCase();
    const n = name.length;
    if (n === 1) {
        return firstChar;
    }
    const text = firstChar + name.substring(1);
    let label = '';
    /**
     * we have ensure that the first character is upper case.
     * hence the loop will end after adding all the words when we come from the end
     */
    let lastAt = n;
    for (let i = n - 1; i >= 0; i--) {
        const c = text.charAt(i);
        if (c >= 'A' && c <= 'Z') {
            const part = text.substring(i, lastAt);
            if (label) {
                label = part + ' ' + label;
            }
            else {
                label = part;
            }
            lastAt = i;
        }
    }
    return label;
}
function formatValue(value, formatter) {
    if (value === undefined) {
        return '';
    }
    const text = '' + value;
    if (formatter.casing) {
        switch (formatter.casing) {
            case 'UPPER':
                return text.toUpperCase();
            case 'lower':
                return text.toLowerCase();
        }
    }
    formatter;
    //TODO: Design and implement this concept
    return text;
}
function getViewState(ele, stateName) {
    const attr = 'data-' + stateName;
    const val = ele.getAttribute(attr);
    if (val === null) {
        return undefined;
    }
    //booleans could be set with no value, or to the name of the attribute itself!!
    if (val === '' || val === attr) {
        return true;
    }
    return val;
}
function setViewState(ele, stateName, stateValue) {
    const vt = typeof stateValue;
    const knownOne = viewStates[stateName];
    if (knownOne && knownOne !== vt) {
        logger.warn(`displayState '${stateName}' takes a ${knownOne} value but ${stateValue} is being set.
      state value not set to the view-component`);
    }
    const attName = 'data-' + stateName;
    if (vt === 'boolean') {
        if (stateValue) {
            ele.setAttribute(attName, '');
        }
        else {
            ele.removeAttribute(attName);
        }
        return;
    }
    const val = '' + stateValue; //playing it safe
    if (val) {
        ele.setAttribute(attName, val);
    }
    else {
        ele.removeAttribute(attName);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbFV0aWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2h0bWwvaHRtbFV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsMkNBQXdDO0FBQ3hDLGtEQUFtRDtBQUVuRDs7R0FFRztBQUNILE1BQU0sVUFBVSxHQUFHO0lBQ2pCOztPQUVHO0lBQ0gsU0FBUyxFQUFFLFNBQVM7SUFFcEI7O09BRUc7SUFDSCxVQUFVLEVBQUUsU0FBUztJQUNyQjs7O09BR0c7SUFDSCxRQUFRLEVBQUUsU0FBUztJQUVuQjs7T0FFRztJQUNILElBQUksRUFBRSxTQUFTO0lBRWY7OztPQUdHO0lBQ0gsRUFBRSxFQUFFLFFBQVE7SUFFWjs7T0FFRztJQUNILE9BQU8sRUFBRSxTQUFTO0lBRWxCOzs7T0FHRztJQUNILEdBQUcsRUFBRSxRQUFRO0lBRWI7O09BRUc7SUFDSCxNQUFNLEVBQUUsU0FBUztJQUVqQjs7OztPQUlHO0lBQ0gsS0FBSyxFQUFFLFFBQVE7SUFFZjs7T0FFRztJQUNILElBQUksRUFBRSxRQUFRO0lBRWQ7O09BRUc7SUFDSCxLQUFLLEVBQUUsUUFBUTtJQUVmOzs7T0FHRztJQUNILE1BQU0sRUFBRSxRQUFRO0NBQ1IsQ0FBQztBQUVYOztHQUVHO0FBQ1UsUUFBQSx1QkFBdUIsR0FBRztJQUNyQyxRQUFRO0lBQ1IsY0FBYztJQUNkLFdBQVc7SUFDWCxTQUFTO0lBQ1QsWUFBWTtJQUNaLFFBQVE7SUFDUixZQUFZO0lBQ1osYUFBYTtJQUNiLE9BQU87SUFDUCxRQUFRO0lBQ1IsTUFBTTtJQUNOLE1BQU07SUFDTixRQUFRO0lBQ1IsV0FBVztJQUNYLFNBQVM7SUFDVCxRQUFRO0lBQ1IsTUFBTTtJQUNOLE9BQU87SUFDUCxZQUFZO0lBQ1osWUFBWTtJQUNaLGFBQWE7SUFDYixVQUFVO0lBQ1YsZUFBZTtJQUNmLFFBQVE7SUFDUixXQUFXO0lBQ1gsaUJBQWlCO0lBQ2pCLEtBQUs7SUFDTCxnQkFBZ0I7SUFDaEIs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