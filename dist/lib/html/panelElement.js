"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PanelElement = void 0;
const baseElement_1 = require("./baseElement");
const elementFactory_1 = require("./elementFactory");
const htmlUtil_1 = require("./htmlUtil");
function getTemplateName(panel) {
    if (panel.panelType) {
        return ('panel-' + panel.panelType);
    }
    return 'panel';
}
class PanelElement extends baseElement_1.BaseElement {
    constructor(fc, panel, maxWidth) {
        super(fc, panel, getTemplateName(panel), maxWidth);
        this.panel = panel;
        let fcForChildren = fc;
        /**
         * is this a child-form?
         * then we have to ensure that all the children are rendered under that
         */
        if (panel.childFormName) {
            const form = this.ac.getForm(panel.childFormName);
            if (fc) {
                fcForChildren = fc.newFormController(this.name, form);
            }
            else {
                this.logger.warn(`panel "${this.name}" has a childFormName, but this panel itself is not controlled by a form. The child form-controller will be made a child of the root-form-controller fo this page`);
                fcForChildren = this.pc
                    .getFormController()
                    .newFormController(this.name, form);
            }
            //fc for child nodes changed to this
            this.childFc = fcForChildren;
        }
        if (!panel.children) {
            this.logger.warn(`panel '${this.name}' is empty`);
            return;
        }
        /**
         * render children
         */
        const container = htmlUtil_1.htmlUtil.getChildElement(this.root, 'container');
        for (const child of panel.children) {
            const ele = elementFactory_1.elementFactory.newElement(fcForChildren, child, maxWidth);
            container.appendChild(ele.root);
        }
        if (this.childFc) {
            this.childFc.formRendered();
        }
    }
}
exports.PanelElement = PanelElement;
//# sourceMappingURL=panelElement.js.map