import { app } from '../controller/app';
import { loggerStub } from '../logger-stub/logger';
import { StringMap, Value, ValueFormatter } from 'simplity-types';
import { BaseElement } from './baseElement';

export type InitFunction = (ele: HTMLElement, view: BaseElement) => void;
export type InitFunctions = StringMap<InitFunction>;

/**
 * name under which global init functions are available in the window
 */
declare const _html_init_functions: InitFunctions;
/**
 * global variable name under which the init functions are made available
 */
export const HTML_INIT_FUNCTIONS: string = '_html_init_functions';
/**
 * display states that are designed by simplity
 */
const designedDisplayStates = {
  hidden: 'boolean',
  disabled: 'boolean',
  inError: 'boolean',
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
} as const;
type DisplayState = keyof typeof designedDisplayStates;
/**
 * to be used only by design-time utilities to check if all the required templates are supplied or not
 */
export const predefinedHtmlTemplates = [
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
  'menu-group',
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
] as const;

export type HtmlTemplateName = (typeof predefinedHtmlTemplates)[number];

export const dataAttributeNames = ['full', 'id'] as const;
export const childElementIds = [
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
] as const;
export type ChildElementId = (typeof childElementIds)[number];
/**
 * caching the templates that are already created
 */
const allTemplates: { [key: string]: HTMLElement } = {};
const logger = loggerStub.getLogger();

export const htmlUtil = {
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
   * Set the display-state of this element to the desired value.
   *
   * @param ele
   * @param stateName  must be a valid name as per the design specification for the app
   *
   * @param value    value as per the design of this attribute.
   */
  setDisplayState,

  /**
   * get the value of a display state.
   * @returns undefined if the state is not set at all,
   *  true if the attribute is set, but with no value, or ="" or with the the name of the attribute itself
   * string otherwise
   */
  getDisplayState,

  /**
   * initialize an html element
   */
  initHtmlEle,
};

function getOptionalElement(
  rootEle: HTMLElement,
  id: ChildElementId | string
): HTMLElement | undefined {
  const ele = rootEle.querySelector(`[data-id="${id}"]`) as HTMLElement;
  if (ele) {
    return ele;
  }

  const att = rootEle.getAttribute('data-id');
  if (id === att) {
    return rootEle;
  }
  return undefined;
}

function getChildElement(rootEle: HTMLElement, id: string): HTMLElement {
  const ele = getOptionalElement(rootEle, id);
  if (ele) {
    return ele;
  }
  console.info(rootEle);
  throw new Error(
    `HTML Template does not contain a child element with data-id="${id}". This is required as a container to render a child component`
  );
}

function newHtmlElement(name: HtmlTemplateName): HTMLElement {
  return newElement('template-' + name);
}

function newElement(name: string): HTMLElement {
  let ele = allTemplates[name];
  if (!ele) {
    let html = app.getCurrentAc().getHtml(name);
    if (!html) {
      logger.warn(
        `A component requires an html-template named "${name}". This template is not available at run time. A dummy HTML is used.`
      );
      html = `<div><!-- html source ${name} not found --></div>`;
    }
    ele = toEle(html);
    allTemplates[name] = ele;
  }
  return ele.cloneNode(true) as HTMLElement;
}

function toEle(html: string): HTMLElement {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content.firstElementChild as HTMLElement;
}

function removeChildren(ele: HTMLElement): void {
  ele.innerHTML = '';
}

function appendText(ele: HTMLElement, text: string): void {
  ele.appendChild(document.createTextNode(text));
}

function appendIcon(ele: HTMLElement, icon: string, alt?: string): void {
  if (icon.endsWith('.html')) {
    const s = icon.substring(0, icon.length - 5);
    const html = app.getCurrentAc().getHtml(s);

    if (html) {
      ele.appendChild(toEle(html));
      return;
    }
    logger.error(
      `an icon named ${icon} could not be created because no html is available with name ${s}`
    );
    return;
  }

  const img = document.createElement('img');
  img.alt = alt || '';
  img.src = app.getCurrentAc().getImageSrc(icon);
  ele.appendChild(img);
}

function toLabel(name: string): string {
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
      } else {
        label = part;
      }
      lastAt = i;
    }
  }
  return label;
}

function formatValue(value: Value, formatter: ValueFormatter): string {
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

function getDisplayState(
  ele: HTMLElement,
  stateName: string
): string | boolean | undefined {
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

function setDisplayState(
  ele: HTMLElement,
  stateName: DisplayState | string,
  stateValue: string | number | boolean
): void {
  const vt = typeof stateValue;
  const knownOne = designedDisplayStates[stateName as DisplayState];
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
    } else {
      ele.removeAttribute(attName);
    }
    return;
  }

  const val = '' + stateValue; //playing it safe
  if (val) {
    ele.setAttribute(attName, val);
  } else {
    ele.removeAttribute(attName);
  }
}

function initHtmlEle(ele: HTMLElement, view: BaseElement) {
  if (!_html_init_functions) {
    return;
  }
  /**
   * does this html require custom initialization?
   */
  const att = htmlUtil.getDisplayState(ele, 'init');
  if (!att) {
    return;
  }

  const fn = _html_init_functions['' + att];
  if (fn) {
    fn(ele, view);
  }
}
