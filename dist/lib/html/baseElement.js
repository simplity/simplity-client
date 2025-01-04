"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseElement = void 0;
const logger_1 = require("../logger-stub/logger");
const app_1 = require("../controller/app");
const htmlUtil_1 = require("./htmlUtil");
const DEFAULT_WIDTH = 4;
/**
 * Base class to be extended by all view components
 * As of now, it is NOT a WebComponent, but a controller that is bound to the root html element.
 * By making this the base class, we have kept the flexibility to refactor them to webComponents later
 * (This approach is similar to Material Design Components of Google.)
 *
 * click event is handled here, while change and changing is handled by the fieldElement
 */
class BaseElement {
    /**
     *
     * @param table meta data for this view component
     * @param templateName to be used to create the HTML element. ignored if root is provided
     * @param template instance to be cloned as HTML element
     */
    constructor(fc, comp, 
    /**
     * mandatory. comp.customHtml, if specified,  will override this.
     */
    templateName, 
    /**
     * width of the parent in number of columns.
     * 0 means this is inside a column of a row of a table
     */
    maxWidth) {
        this.fc = fc;
        this.comp = comp;
        this.maxWidth = maxWidth;
        this.logger = logger_1.loggerStub.getLogger();
        this.name = comp.name;
        if (fc) {
            this.pc = fc.pc;
            this.ac = this.pc.ac;
        }
        else {
            this.ac = app_1.app.getCurrentAc();
            this.pc = app_1.app.getCurrentPc();
        }
        if (templateName === '') {
            this.root = document.createElement('div');
            return;
        }
        this.root = htmlUtil_1.htmlUtil.newHtmlElement(comp.customHtml || 'template' + '-' + templateName);
        this.containerEle = htmlUtil_1.htmlUtil.getOptionalElement(this.root, 'container');
        if (maxWidth !== 0) {
            /**
             * colSpan for this element. Default for container is full
             */
            let colSpan = comp.width || (this.containerEle ? maxWidth : DEFAULT_WIDTH);
            if (colSpan > maxWidth) {
                this.logger
                    .error(`Page element '${this.name}' specifies a width of ${colSpan} but the max possible width is only ${maxWidth};
        Page may not render properly`);
                colSpan = maxWidth;
            }
            htmlUtil_1.htmlUtil.setColSpan(this.root, colSpan);
        }
        /**
         * set the number of columns same as colSpan, if this is a container
         */
        if (this.containerEle) {
            htmlUtil_1.htmlUtil.setAsGrid(this.containerEle);
        }
        if (fc) {
            fc.registerChild(this);
            this.root.addEventListener('click', () => {
                this.clicked();
            });
        }
        /**
         *
         * we will handle input control specific aspects in the base element itself
         */
        this.inputEle = this.root.querySelector('input') || undefined;
        if (comp.label) {
            this.labelEle = htmlUtil_1.htmlUtil.getOptionalElement(this.root, 'label');
            if (this.labelEle) {
                this.labelEle.innerText = comp.label;
            }
            else {
                this.logger.info(`node ${comp.name} has a label value of "${comp.label}" bot the html has no element with data-id="label"`);
            }
        }
    }
    /**
     * concrete classes should implement this if error is relevant
     * @param msg
     */
    setError(msg) {
        this.logger.warn(`component type ${this.comp.compType} has not implemented setError(), but a request is received with value="${msg}"`);
        this.setDataAttr('error', msg === undefined ? undefined : '' + msg);
    }
    setDisplay(settings) {
        for (const [setting, value] of Object.entries(settings)) {
            switch (setting) {
                case 'error':
                    this.setError(value);
                    return;
                case 'disabled':
                    if (this.inputEle) {
                        this.inputEle.disabled = !!value;
                        return;
                    }
                    this.setDataAttr('disabled', value);
                    return;
                case 'hidden':
                default:
                    this.setDataAttr(setting, value);
            }
        }
    }
    clicked() {
        const action = this.comp.onClick;
        if (action) {
            if (this.fc) {
                this.fc.act(action);
            }
            else {
                this.pc.act(action);
            }
        }
        /**
         * there could be listeners..
         */
        if (this.fc) {
            this.fc.eventOccurred({
                eventName: 'click',
                viewName: this.name,
                view: this,
                fc: this.fc,
            });
        }
    }
    /**
     *
     * @param attr name of the attribute, (without the data-prefix)
     * @param value undefined to remove the attribute. String, including empty string, to set the value
     * @returns
     */
    setDataAttr(attr, value) {
        const att = 'data-' + attr;
        if (value === undefined) {
            this.root.removeAttribute(att);
            return;
        }
        this.root.setAttribute(att, value);
    }
}
exports.BaseElement = BaseElement;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZUVsZW1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2h0bWwvYmFzZUVsZW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsa0RBQW1EO0FBQ25ELDJDQUF3QztBQUN4Qyx5Q0FBc0M7QUFZdEMsTUFBTSxhQUFhLEdBQUcsQ0FBQyxDQUFDO0FBQ3hCOzs7Ozs7O0dBT0c7QUFDSCxNQUFhLFdBQVc7SUFxQnRCOzs7OztPQUtHO0lBQ0gsWUFDa0IsRUFBOEIsRUFDOUIsSUFBbUI7SUFDbkM7O09BRUc7SUFDSCxZQUFvQjtJQUNwQjs7O09BR0c7SUFDTyxRQUFpQjtRQVZYLE9BQUUsR0FBRixFQUFFLENBQTRCO1FBQzlCLFNBQUksR0FBSixJQUFJLENBQWU7UUFTekIsYUFBUSxHQUFSLFFBQVEsQ0FBUztRQXJDVixXQUFNLEdBQUcsbUJBQVUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQXVDakQsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ3RCLElBQUksRUFBRSxFQUFFLENBQUM7WUFDUCxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUM7WUFDaEIsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztRQUN2QixDQUFDO2FBQU0sQ0FBQztZQUNOLElBQUksQ0FBQyxFQUFFLEdBQUcsU0FBRyxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQzdCLElBQUksQ0FBQyxFQUFFLEdBQUcsU0FBRyxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQy9CLENBQUM7UUFFRCxJQUFJLFlBQVksS0FBSyxFQUFFLEVBQUUsQ0FBQztZQUN4QixJQUFJLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDMUMsT0FBTztRQUNULENBQUM7UUFFRCxJQUFJLENBQUMsSUFBSSxHQUFHLG1CQUFRLENB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