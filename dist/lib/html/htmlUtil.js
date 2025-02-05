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
    if (knownOne) {
        if (knownOne !== vt) {
            logger.error(`displayState '${stateName}' takes a ${knownOne} value but ${stateValue} is being set.
      state value not to the view-component   `);
            return;
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbFV0aWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2h0bWwvaHRtbFV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsMkNBQXdDO0FBQ3hDLGtEQUFtRDtBQUVuRDs7R0FFRztBQUNILE1BQU0sVUFBVSxHQUFHO0lBQ2pCOzs7T0FHRztJQUNILFFBQVEsRUFBRSxTQUFTO0lBRW5COztPQUVHO0lBQ0gsSUFBSSxFQUFFLFNBQVM7SUFFZjs7O09BR0c7SUFDSCxFQUFFLEVBQUUsUUFBUTtJQUVaOztPQUVHO0lBQ0gsT0FBTyxFQUFFLFNBQVM7SUFFbEI7OztPQUdHO0lBQ0gsR0FBRyxFQUFFLFFBQVE7SUFFYjs7T0FFRztJQUNILE1BQU0sRUFBRSxTQUFTO0lBRWpCOzs7O09BSUc7SUFDSCxLQUFLLEVBQUUsUUFBUTtJQUVmOztPQUVHO0lBQ0gsSUFBSSxFQUFFLFFBQVE7Q0FDTixDQUFDO0FBRVg7O0dBRUc7QUFDVSxRQUFBLHVCQUF1QixHQUFHO0lBQ3JDLFFBQVE7SUFDUixjQUFjO0lBQ2QsV0FBVztJQUNYLFNBQVM7SUFDVCxZQUFZO0lBQ1osUUFBUTtJQUNSLFlBQVk7SUFDWixhQUFhO0lBQ2IsT0FBTztJQUNQLFFBQVE7SUFDUixNQUFNO0lBQ04sTUFBTTtJQUNOLFFBQVE7SUFDUixXQUFXO0lBQ1gsU0FBUztJQUNULFFBQVE7SUFDUixNQUFNO0lBQ04sT0FBTztJQUNQLFlBQVk7SUFDWixZQUFZO0lBQ1osYUFBYTtJQUNiLFVBQVU7SUFDVixlQUFlO0lBQ2YsUUFBUTtJQUNSLFdBQVc7SUFDWCxpQkFBaUI7SUFDakIsS0FBSztJQUNMLGdCQUFnQjtJQUNoQixPQUFPO0lBQ1AsTUFBTTtJQUNOLFdBQVc7SUFDWCxZQUFZO0NBQ0osQ0FBQztBQUlYOztHQUVHO0FBQ1UsUUFBQSxrQkFBa0IsR0FBRyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQVUsQ0FBQztBQUM3QyxRQUFBLGVBQWUsR0FB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