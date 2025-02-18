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
        if (comp.templateName) {
            this.root = htmlUtil_1.htmlUtil.newCustomElement(comp.templateName);
        }
        else if (templateName === '') {
            this.root = document.createElement('div');
            return;
        }
        else {
            this.root = htmlUtil_1.htmlUtil.newHtmlElement(templateName);
        }
        if (fc) {
            fc.registerChild(this);
            this.root.addEventListener('click', () => {
                this.clicked();
            });
        }
        /**
         *
         * input and panel are quite common. Hence added them to the base
         */
        this.inputEle = this.root.querySelector('input') || undefined;
        this.containerEle = htmlUtil_1.htmlUtil.getOptionalElement(this.root, 'container');
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
        /**
         * set colSpan to maxWidth if parent has specified id
         */
        if (maxWidth !== 0) {
            let width = comp.width;
            if (width === undefined) {
                if (htmlUtil_1.htmlUtil.getViewState(this.root, 'full') !== undefined) {
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
            if (this.containerEle) {
                htmlUtil_1.htmlUtil.setViewState(this.containerEle, 'width', width);
            }
        }
    }
    /**
     * concrete classes should implement this if error is relevant
     * @param msg
     */
    setError(msg) {
        this.logger.warn(`component type ${this.comp.compType} has not implemented setError(), but a request is received with value="${msg}"`);
        htmlUtil_1.htmlUtil.setViewState(this.root, 'invalid', msg !== undefined);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZUVsZW1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2h0bWwvYmFzZUVsZW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsa0RBQW1EO0FBQ25ELDJDQUF3QztBQUN4Qyx5Q0FBbUU7QUFXbkUsTUFBTSxhQUFhLEdBQUcsQ0FBQyxDQUFDO0FBQ3hCOzs7Ozs7O0dBT0c7QUFDSCxNQUFhLFdBQVc7SUFxQnRCOzs7OztPQUtHO0lBQ0gsWUFDa0IsRUFBOEIsRUFDOUIsSUFBbUI7SUFDbkM7O09BRUc7SUFDSCxZQUFtQztJQUNuQzs7O09BR0c7SUFDTyxRQUFnQjtRQVZWLE9BQUUsR0FBRixFQUFFLENBQTRCO1FBQzlCLFNBQUksR0FBSixJQUFJLENBQWU7UUFTekIsYUFBUSxHQUFSLFFBQVEsQ0FBUTtRQXJDVCxXQUFNLEdBQUcsbUJBQVUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQXVDakQsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ3RCLElBQUksRUFBRSxFQUFFLENBQUM7WUFDUCxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUM7WUFDaEIsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztRQUN2QixDQUFDO2FBQU0sQ0FBQztZQUNOLElBQUksQ0FBQyxFQUFFLEdBQUcsU0FBRyxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQzdCLElBQUksQ0FBQyxFQUFFLEdBQUcsU0FBRyxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQy9CLENBQUM7UUFFRCxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUN0QixJQUFJLENBQUMsSUFBSSxHQUFHLG1CQUFRLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQzNELENBQUM7YUFBTSxJQUFJLFlBQVksS0FBSyxFQUFFLEVBQUUs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