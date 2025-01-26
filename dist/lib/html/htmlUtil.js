"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.htmlUtil = exports.childElementIds = exports.dataAttributeNames = exports.predefinedHtmlTemplates = exports.HTML_INIT_FUNCTIONS = void 0;
const app_1 = require("../controller/app");
const logger_1 = require("../logger-stub/logger");
/**
 * global variable name under which the init functions are made available
 */
exports.HTML_INIT_FUNCTIONS = '_html_init_functions';
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
    inError: 'boolean',
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
    'image-field',
    'image',
    'layout',
    'line',
    'list',
    'module',
    'menu-item',
    'output',
    'page',
    'page-panel',
    'panel-grid',
    'panel-flex',
    'panel',
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
    /**
     * initialize an html element
     */
    initHtmlEle,
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
function initHtmlEle(ele, view) {
    if (!_html_init_functions) {
        return;
    }
    /**
     * does this html require custom initialization?
     */
    const att = exports.htmlUtil.getViewState(ele, 'init');
    if (!att) {
        return;
    }
    const fn = _html_init_functions['' + att];
    if (fn) {
        fn(ele, view);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbFV0aWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2h0bWwvaHRtbFV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsMkNBQXdDO0FBQ3hDLGtEQUFtRDtBQVduRDs7R0FFRztBQUNVLFFBQUEsbUJBQW1CLEdBQVcsc0JBQXNCLENBQUM7QUFDbEU7O0dBRUc7QUFDSCxNQUFNLFVBQVUsR0FBRztJQUNqQjs7O09BR0c7SUFDSCxRQUFRLEVBQUUsU0FBUztJQUVuQjs7T0FFRztJQUNILElBQUksRUFBRSxTQUFTO0lBRWY7OztPQUdHO0lBQ0gsRUFBRSxFQUFFLFFBQVE7SUFFWjs7T0FFRztJQUNILE9BQU8sRUFBRSxTQUFTO0lBRWxCOzs7T0FHRztJQUNILEdBQUcsRUFBRSxRQUFRO0lBRWI7O09BRUc7SUFDSCxNQUFNLEVBQUUsU0FBUztJQUVqQjs7OztPQUlHO0lBQ0gsS0FBSyxFQUFFLFFBQVE7SUFFZjs7T0FFRztJQUNILElBQUksRUFBRSxRQUFRO0NBQ04sQ0FBQztBQUVYOztHQUVHO0FBQ1UsUUFBQSx1QkFBdUIsR0FBRztJQUNyQyxRQUFRO0lBQ1IsY0FBYztJQUNkLFdBQVc7SUFDWCxTQUFTO0lBQ1QsWUFBWTtJQUNaLFFBQVE7SUFDUixhQUFhO0lBQ2IsT0FBTztJQUNQLFFBQVE7SUFDUixNQUFNO0lBQ04sTUFBTTtJQUNOLFFBQVE7SUFDUixXQUFXO0lBQ1gsUUFBUTtJQUNSLE1BQU07SUFDTixZQUFZO0lBQ1osWUFBWTtJQUNaLFlBQVk7SUFDWixPQUFPO0lBQ1AsVUFBVTtJQUNWLGVBQWU7SUFDZixRQUFRO0lBQ1IsV0FBVztJQUNYLGlCQUFpQjtJQUNqQixLQUFLO0lBQ0wsZ0JBQWdCO0lBQ2hCLE9BQU87SUFDUCxNQUFNO0lBQ04sV0FBVztJQUNYLFlBQVk7Q0FDSixDQUFDO0FBSVg7O0dBRUc7QUFDVSxRQUFBLGtCQUFrQixHQUFHLENBQUMsTUFBTSxFQUFFLElBQUksQ0FB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