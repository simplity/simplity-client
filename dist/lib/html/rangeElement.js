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
        const fromEle = htmlUtil.getChildElement(this.root, 'from-field');
        const toEle = htmlUtil.getChildElement(this.root, 'to-field');
        this.fromView = new FieldElement(fc, range.fromField, 0, undefined, fromEle);
        this.toView = new FieldElement(fc, range.toField, 0, undefined, toEle);
    }
}
//# sourceMappingURL=rangeElement.js.map