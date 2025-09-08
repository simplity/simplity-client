"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RangeElement = void 0;
const baseElement_1 = require("./baseElement");
const htmlUtil_1 = require("./htmlUtil");
const elementFactory_1 = require("./elementFactory");
class RangeElement extends baseElement_1.BaseElement {
    constructor(fc, range, maxWidth) {
        super(fc, range, 'range-wrapper', maxWidth);
        this.range = range;
        this.fromView = elementFactory_1.elementFactory.newElement(fc, range.fromField, maxWidth);
        let ele = htmlUtil_1.htmlUtil.getChildElement(this.root, 'from-field');
        ele.appendChild(this.fromView.root);
        this.toView = elementFactory_1.elementFactory.newElement(fc, range.toField, maxWidth);
        ele = htmlUtil_1.htmlUtil.getChildElement(this.root, 'to-field');
        ele.appendChild(this.toView.root);
    }
}
exports.RangeElement = RangeElement;
//# sourceMappingURL=rangeElement.js.map