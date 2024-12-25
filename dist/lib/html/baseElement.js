"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseElement = void 0;
const logger_1 = require("../logger-stub/logger");
const app_1 = require("../controller/app");
const htmlUtil_1 = require("./htmlUtil");
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
    constructor(fc, comp, templateName) {
        this.fc = fc;
        this.comp = comp;
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
        this.root = htmlUtil_1.htmlUtil.newHtmlElement(comp.customHtml || 'template' + '-' + templateName);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZUVsZW1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2h0bWwvYmFzZUVsZW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsa0RBQW1EO0FBQ25ELDJDQUF3QztBQUN4Qyx5Q0FBc0M7QUFXdEM7Ozs7Ozs7R0FPRztBQUNILE1BQWEsV0FBVztJQVl0Qjs7Ozs7T0FLRztJQUNILFlBQ2tCLEVBQThCLEVBQzlCLElBQW1CLEVBQ25DLFlBQXFCO1FBRkwsT0FBRSxHQUFGLEVBQUUsQ0FBNEI7UUFDOUIsU0FBSSxHQUFKLElBQUksQ0FBZTtRQW5CbEIsV0FBTSxHQUFHLG1CQUFVLENBQUMsU0FBUyxFQUFFLENBQUM7UUFzQmpELElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztRQUN0QixJQUFJLEVBQUUsRUFBRSxDQUFDO1lBQ1AsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDO1lBQ2hCLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7UUFDdkIsQ0FBQzthQUFNLENBQUM7WUFDTixJQUFJLENBQUMsRUFBRSxHQUFHLFNBQUcsQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUM3QixJQUFJLENBQUMsRUFBRSxHQUFHLFNBQUcsQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUMvQixDQUFDO1FBQ0QsSUFBSSxDQUFDLElBQUksR0FBRyxtQkFBUSxDQUFDLGNBQWMsQ0FDakMsSUFBSSxDQUFDLFVBQVUsSUFBSSxVQUFVLEdBQUcsR0FBRyxHQUFHLFlBQVksQ0FDbkQsQ0FBQztRQUNGLElBQUksRUFBRSxFQUFFLENBQUM7WUFDUCxFQUFFLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRTtnQkFDdkMsSUFBSSxDQUFD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