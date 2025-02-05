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
        if (comp.customHtml) {
            this.root = htmlUtil_1.htmlUtil.newCustomElement(comp.customHtml);
        }
        else if (templateName === '') {
            this.root = document.createElement('div');
            return;
        }
        else {
            this.root = htmlUtil_1.htmlUtil.newHtmlElement(templateName);
        }
        /**
         * set colSpan if maxWidth if parent has specified max-width
         */
        if (maxWidth !== 0) {
            let width = comp.width;
            if (width === undefined) {
                //default for a normal panel is 'full'
                if (comp.compType === 'panel' &&
                    comp.panelType === undefined) {
                    width = maxWidth;
                }
                else if (htmlUtil_1.htmlUtil.getViewState(this.root, 'full') !== undefined) {
                    //the html root has signalled that it wants full width
                    width = maxWidth;
                }
                else {
                    width = DEFAULT_WIDTH;
                }
            }
            if (width > maxWidth) {
                this.logger
                    .error(`Page element '${this.name}' specifies a width of ${width} but the max possible width is only ${maxWidth};
        Page may not render properly`);
                width = maxWidth;
            }
            htmlUtil_1.htmlUtil.setViewState(this.root, 'width', width);
        }
        if (fc) {
            fc.registerChild(this);
            this.root.addEventListener('click', () => {
                this.clicked();
            });
        }
        /**
         *
         * input element is quite common. adding this simple line to the base itself
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
        /**
         * does this html require custom initialization?
         */
        const att = htmlUtil_1.htmlUtil.getViewState(this.root, 'init');
        if (att) {
            const fnName = '' + att;
            const fn = this.ac.getFn(fnName, 'init');
            fn.fn(this);
        }
        /**
         * initial display states
         */
        if (comp.displayStates) {
            this.setDisplayState(comp.displayStates);
        }
    }
    /**
     * concrete classes should implement this if error is relevant
     * @param msg
     */
    setError(msg) {
        this.logger.warn(`component type ${this.comp.compType} has not implemented setError(), but a request is received with value="${msg}"`);
        htmlUtil_1.htmlUtil.setViewState(this.root, 'error', msg !== undefined);
    }
    setDisplayState(settings) {
        for (const [name, value] of Object.entries(settings)) {
            htmlUtil_1.htmlUtil.setViewState(this.root, name, value);
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
}
exports.BaseElement = BaseElement;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZUVsZW1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2h0bWwvYmFzZUVsZW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsa0RBQW1EO0FBQ25ELDJDQUF3QztBQUN4Qyx5Q0FBd0Q7QUFZeEQsTUFBTSxhQUFhLEdBQUcsQ0FBQyxDQUFDO0FBQ3hCOzs7Ozs7O0dBT0c7QUFDSCxNQUFhLFdBQVc7SUFpQnRCOzs7OztPQUtHO0lBQ0gsWUFDa0IsRUFBOEIsRUFDOUIsSUFBbUI7SUFDbkM7O09BRUc7SUFDSCxZQUFtQztJQUNuQzs7O09BR0c7SUFDTyxRQUFnQjtRQVZWLE9BQUUsR0FBRixFQUFFLENBQTRCO1FBQzlCLFNBQUksR0FBSixJQUFJLENBQWU7UUFTekIsYUFBUSxHQUFSLFFBQVEsQ0FBUTtRQWpDVCxXQUFNLEdBQUcsbUJBQVUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQW1DakQsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ3RCLElBQUksRUFBRSxFQUFFLENBQUM7WUFDUCxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUM7WUFDaEIsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztRQUN2QixDQUFDO2FBQU0sQ0FBQztZQUNOLElBQUksQ0FBQyxFQUFFLEdBQUcsU0FBRyxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQzdCLElBQUksQ0FBQyxFQUFFLEdBQUcsU0FBRyxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQy9CLENBQUM7UUFFRCxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNwQixJQUFJLENBQUMsSUFBSSxHQUFHLG1CQUFRLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3pELENBQUM7YUFBTSxJQUFJLFlBQVksS0FBSyxFQUFFLEVBQUUs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