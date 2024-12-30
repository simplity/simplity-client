import { app } from '../controller/app';
import { loggerStub } from '../logger-stub/logger';
import { NbrCols, Value, ValueFormatter } from 'simplity-types';

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
  setAsGrid,
  setColSpan,
  newPageContainer,
};

function getOptionalElement(
  rootEle: HTMLElement,
  id: string
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

function newHtmlElement(name: string): HTMLElement {
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

/**
 *
 * @param ele child element whose width is to be specified in terms of number of columns
 * @param n number of columns
 */
function setColSpan(ele: HTMLElement, n: NbrCols) {
  ele.classList.add('col-span-' + n);
}

/**
 * mark this as a subgrid.
 * @param ele
 */
function setAsGrid(ele: HTMLElement) {
  ele.classList.add('grid', 'grid-cols-subgrid');
}

/**
 * We use a grid-layout concept with 12 columns for the page.
 * Create the page container as a grid with 12 columns.
 * Every container element will now be a subgrid
 */
function newPageContainer(): HTMLDivElement {
  const ele = document.createElement('div');
  ele.classList.add('grid', 'grid-cols-12', 'gap-4');
  return ele;
}
