import { loggerStub } from '../logger-stub/logger';
import { app } from '../controller/app';
import { htmlUtil } from './htmlUtil';
const DEFAULT_WIDTH = 4;
/**
 * Base class to be extended by all view components
 * As of now, it is NOT a WebComponent, but a controller that is bound to the root html element.
 * By making this the base class, we have kept the flexibility to refactor them to webComponents later
 * (This approach is similar to Material Design Components of Google.)
 *
 * click event is handled here, while change and changing is handled by the fieldElement
 */
export class BaseElement {
    fc;
    comp;
    maxWidth;
    logger = loggerStub.getLogger();
    ac;
    pc;
    /**
     * If this is an input
     */
    inputEle;
    /**
     * If this is a container? Added to the base class because it is quite common
     */
    containerEle;
    labelEle;
    name;
    /**
     * root of the html element that this controller manages.
     */
    root;
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
        this.name = comp.name;
        if (fc) {
            this.pc = fc.pc;
            this.ac = this.pc.ac;
        }
        else {
            this.ac = app.getCurrentAc();
            this.pc = app.getCurrentPc();
        }
        if (comp.templateName) {
            this.root = htmlUtil.newCustomElement(comp.templateName);
        }
        else if (templateName === '') {
            this.root = document.createElement('div');
            return;
        }
        else {
            this.root = htmlUtil.newHtmlElement(templateName);
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
        this.containerEle = htmlUtil.getOptionalElement(this.root, 'container');
        if (comp.label) {
            this.labelEle = htmlUtil.getOptionalElement(this.root, 'label');
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
        const att = htmlUtil.getViewState(this.root, 'init');
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
                if (htmlUtil.getViewState(this.root, 'full') !== undefined) {
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
            htmlUtil.setViewState(this.root, 'width', width);
            if (this.containerEle) {
                htmlUtil.setViewState(this.containerEle, 'width', width);
            }
        }
    }
    /**
     * concrete classes should implement this if error is relevant
     * @param msg
     */
    setError(msg) {
        this.logger.warn(`component type ${this.comp.compType} has not implemented setError(), but a request is received with value="${msg}"`);
        htmlUtil.setViewState(this.root, 'invalid', msg !== undefined);
    }
    setDisplayState(settings) {
        for (const [name, value] of Object.entries(settings)) {
            htmlUtil.setViewState(this.root, name, value);
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
//# sourceMappingURL=baseElement.js.map