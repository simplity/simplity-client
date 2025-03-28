import { BaseElement } from './baseElement';
import { htmlUtil } from './htmlUtil';
import { FieldElement } from './fieldElement';
export class RangeElement extends BaseElement {
    range;
    fromView;
    toView;
    constructor(fc, range, maxWidth) {
        super(fc, range, 'range-wrapper', maxWidth);
        this.range = range;
        this.fromView = new FieldElement(fc, range.fromField, 0);
        let ele = htmlUtil.getChildElement(this.root, 'from-field');
        ele.appendChild(this.fromView.root);
        this.toView = new FieldElement(fc, range.toField, 0);
        ele = htmlUtil.getChildElement(this.root, 'to-field');
        ele.appendChild(this.toView.root);
    }
}
//# sourceMappingURL=rangeElement.js.map