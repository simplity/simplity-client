"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.htmlUtil = void 0;
const app_1 = require("../controller/app");
const logger_1 = require("../logger-stub/logger");
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
/**
 *
 * @param ele child element whose width is to be specified in terms of number of columns
 * @param n number of columns
 */
function setColSpan(ele, n) {
    ele.classList.add('col-span-' + n);
}
/**
 * mark this as a subgrid.
 * @param ele
 */
function setAsGrid(ele) {
    ele.classList.add('grid', 'grid-cols-subgrid');
}
/**
 * We use a grid-layout concept with 12 columns for the page.
 * Create the page container as a grid with 12 columns.
 * Every container element will now be a subgrid
 */
function newPageContainer() {
    const ele = document.createElement('div');
    ele.classList.add('grid', 'grid-cols-12', 'gap-4', 'w-full');
    return ele;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbFV0aWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2h0bWwvaHRtbFV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsMkNBQXdDO0FBQ3hDLGtEQUFtRDtBQUduRDs7R0FFRztBQUNILE1BQU0sWUFBWSxHQUFtQyxFQUFFLENBQUM7QUFDeEQsTUFBTSxNQUFNLEdBQUcsbUJBQVUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUV6QixRQUFBLFFBQVEsR0FBRztJQUN0Qjs7T0FFRztJQUNILGNBQWM7SUFDZDs7O09BR0c7SUFDSCxjQUFjO0lBQ2Q7Ozs7Ozs7O09BUUc7SUFDSCxlQUFlO0lBQ2Y7Ozs7Ozs7T0FPRztJQUNILGtCQUFrQjtJQUVsQjs7OztPQUlHO0lBQ0gsVUFBVTtJQUVWOzs7OztPQUtHO0lBQ0gsVUFBVTtJQUVWOzs7O09BSUc7SUFDSCxPQUFPO0lBRVA7Ozs7O09BS0c7SUFFSCxXQUFXO0lBQ1gsU0FBUztJQUNULFVBQVU7SUFDVixnQkFBZ0I7Q0FDakIsQ0FBQztBQUVGLFNBQVMsa0JBQWtCLENBQ3pCLE9BQW9CLEVBQ3BCLEVBQVU7SUFFVixNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQWdCLENBQUM7SUFDdEUsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNSLE9BQU8sR0FBRyxDQUFDO0lBQ2IsQ0FBQztJQUVELE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDNUMsSUFBSSxFQUFFLEtBQUssR0FBRyxFQUFFLENBQUM7UUFDZixPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDO0lBQ0QsT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQztBQUVELFNBQVMsZUFBZSxDQUFDLE9BQW9CLEVBQUUsRUFBVTtJQUN2RCxNQUFNLEdBQUcsR0FBRyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDNUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNSLE9BQU8sR0FBRyxDQUFDO0lBQ2IsQ0FBQztJQUNELE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDdEIsTUFBTSxJQUFJLEtBQUssQ0FDYixnRUFBZ0UsRUFBRSxnRUFBZ0UsQ0FDbkksQ0FBQztBQUNKLENBQUM7QUFFRCxTQUFTLGNBQWMsQ0FBQyxJQUFZO0lBQ2xDLElBQUksR0FBRyxHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM3QixJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDVCxJQUFJLElBQUksR0FBRyxTQUFHLENBQUMsWUFBWSxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNWLE1BQU0sQ0FBQyxJQUFJLENBQ1QsZ0RBQWdELElBQUksc0VBQXNFLENBQzNILENBQUM7WUFDRixJQUFJLEdBQUcseUJBQXlCLElBQUksc0JBQXNCLENBQUM7UUFDN0QsQ0FBQztRQUNELEdBQUcsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbEIsWUFBWSxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQztJQUMzQixDQUFDO0lBQ0QsT0FBTyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBZ0IsQ0FBQztBQUM1QyxDQUFDO0FBRUQsU0FBUyxLQUFLLENBQUMsSUFBWTtJQUN6QixNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ3BELFFBQVEsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO0lBQzFCLE9BQU8sUUFBUSxDQUFDLE9BQU8sQ0FBQyxpQkFBZ0MsQ0FBQztBQUMzRCxDQUFDO0FBRUQsU0FBUyxjQUFjLENBQUMsR0FBZ0I7SUFDdEMsR0FBRyxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7QUFDckIsQ0FBQztBQUVELFNBQVMsVUFBVSxDQUFDLEdBQWdCLEVBQUUsSUFBWTtJQUNoRCxHQUFHLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNqRCxDQUFDO0FBQ0QsU0FBUyxVQUFVLENBQUMsR0FBZ0IsRUFBRSxJQUFZLEVBQUUsR0FBWTtJQUM5RCxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUMzQixNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQzdDLE1BQU0sSUFBSSxHQUFHLFNBQUcsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFM0MsSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUNULEdBQUcsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDN0IsT0FBTztRQUNULENBQUM7UUFDRCxNQUFNLENBQUMsS0FBSyxDQUNWLGlCQUFpQixJQUFJLGdFQUFnRSxDQUFDLEVBQUUsQ0FDekYsQ0FBQztRQUNGLE9BQU87SUFDVCxDQUFDO0lBRUQsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMxQyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsSUFBSSxFQUFFLENBQUM7SUFDcEIsR0FBRyxDQUFDLEdBQUcsR0FBRyxTQUFHLENBQUMsWUFBWSxFQUFFLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQy9DLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDdkIsQ0FBQztBQUVELFNBQVMsT0FBTyxDQUFDLElBQVk7SUFDM0IsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ1YsT0FBTyxFQUFFLENBQUM7SUFDWixDQUFDO0lBQ0QsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUMvQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO0lBQ3RCLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQ1osT0FBTyxTQUFTLENBQUM7SUFDbkIsQ0FBQztJQUNELE1BQU0sSUFBSSxHQUFHLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNDLElBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQztJQUNmOzs7T0FHRztJQUNILElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQztJQUNmLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDaEMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN6QixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQ3pCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3ZDLElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQ1YsS0FBSyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsS0FBSyxDQUFDO1lBQzdCLENBQUM7aUJBQU0sQ0FBQztnQkFDTixLQUFLLEdBQUcsSUFBSSxDQUFDO1lBQ2YsQ0FBQztZQUNELE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDYixDQUFDO0lBQ0gsQ0FBQztJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUVELFNBQVMsV0FBVyxDQUFDLEtBQVksRUFBRSxTQUF5QjtJQUMxRCxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUUsQ0FBQztRQUN4QixPQUFPLEVBQUUsQ0FBQztJQUNaLENBQUM7SUFDRCxNQUFNLElBQUksR0FBRyxFQUFFLEdBQUcsS0FBSyxDQUFDO0lBQ3hCLElBQUksU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3JCLFFBQVEsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ3pCLEtBQUssT0FBTztnQkFDVixPQUFPLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUM1QixLQUFLLE9BQU87Z0JBQ1YsT0FBTyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDOUIsQ0FBQztJQUNILENBQUM7SUFDRCxTQUFTLENBQUM7SUFDVix5Q0FBeUM7SUFDekMsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILFNBQVMsVUFBVSxDQUFDLEdBQWdCLEVBQUUsQ0FBVTtJQUM5QyxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDckMsQ0FBQztBQUVEOzs7R0FHRztBQUNILFNBQVMsU0FBUyxDQUFDLEdBQWdCO0lBQ2pDLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO0FBQ2pELENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBUyxnQkFBZ0I7SUFDdkIsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMxQyxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsY0FBYyxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztJQUM3RCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUMifQ==