import { FormController, RangePanel } from 'simplity-types';
import { BaseElement } from './baseElement';
import { elementFactory } from './elementFactory';
import { htmlUtil } from './htmlUtil';

export class RangeElement extends BaseElement {
  constructor(
    fc: FormController | undefined,
    public readonly range: RangePanel,
    maxWidth: number
  ) {
    super(fc, range, 'range-wrapper', maxWidth);

    let fcForChildren = fc;

    /**
     * render children
     */
    let ele = elementFactory.newElement(
      fcForChildren,
      range.fromField,
      maxWidth
    );
    let parentEle = htmlUtil.getChildElement(this.root, 'from-field');
    parentEle.appendChild(ele.root);
    ele = elementFactory.newElement(fcForChildren, range.toField, maxWidth);
    parentEle = htmlUtil.getChildElement(this.root, 'to-field');
    parentEle.appendChild(ele.root);
  }
}
