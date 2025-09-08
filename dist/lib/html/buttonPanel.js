"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ButtonPanelElement = void 0;
const baseElement_1 = require("./baseElement");
const elementFactory_1 = require("./elementFactory");
const htmlUtil_1 = require("./htmlUtil");
/**
 * button panel renders action buttons, typically at the bottom of a form
 * Current design is to use left, center and right partitions to render three types of buttons.
 * 1. buttons to go back on the left
 * 2. action buttons for this form in the center
 * 3. buttons that take you forward, like next step, on the right
 *
 * this is just a wrapper and is not a component. It's job is to render its child components
 */
class ButtonPanelElement extends baseElement_1.BaseElement {
    constructor(fc, panel, maxWidth) {
        super(fc, panel, 'button-panel', maxWidth);
        this.panel = panel;
        /**
         * render the three sets of buttons
         */
        for (const [place, buttons] of [
            ['left', panel.leftButtons],
            ['middle', panel.middleButtons],
            ['right', panel.rightButtons],
        ]) {
            if (buttons) {
                const parent = htmlUtil_1.htmlUtil.getChildElement(this.root, place);
                for (const button of buttons) {
                    const ele = elementFactory_1.elementFactory.newElement(fc, button, 0);
                    parent.appendChild(ele.root);
                }
            }
        }
    }
}
exports.ButtonPanelElement = ButtonPanelElement;
//# sourceMappingURL=buttonPanel.js.map