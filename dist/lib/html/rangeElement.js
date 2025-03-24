import { BaseElement } from './baseElement';
import { elementFactory } from './elementFactory';
import { htmlUtil } from './htmlUtil';
export class RangeElement extends BaseElement {
    range;
    constructor(fc, range, maxWidth) {
        super(fc, range, 'range-wrapper', maxWidth);
        this.range = range;
        let fcForChildren = fc;
        /**
         * render children
         */
        let ele = elementFactory.newElement(fcForChildren, range.fromField, maxWidth);
        let parentEle = htmlUtil.getChildElement(this.root, 'from-field');
        parentEle.appendChild(ele.root);
        ele = elementFactory.newElement(fcForChildren, range.toField, maxWidth);
        parentEle = htmlUtil.getChildElement(this.root, 'to-field');
        parentEle.appendChild(ele.root);
    }
}
//# sourceMappingURL=rangeElement.js.map