import { BaseElement } from './baseElement';
import { htmlUtil } from './htmlUtil';
import { elementFactory } from './elementFactory';
export class RangeElement extends BaseElement {
    range;
    fromView;
    toView;
    constructor(fc, range, maxWidth) {
        super(fc, range, 'range-wrapper', maxWidth);
        this.range = range;
        this.fromView = elementFactory.newElement(fc, range.fromField, maxWidth);
        let ele = htmlUtil.getChildElement(this.root, 'from-field');
        ele.appendChild(this.fromView.root);
        this.toView = elementFactory.newElement(fc, range.toField, maxWidth);
        ele = htmlUtil.getChildElement(this.root, 'to-field');
        ele.appendChild(this.toView.root);
    }
}
//# sourceMappingURL=rangeElement.js.map