import { DataField, FormController, RangePanel } from 'simplity-types';
import { BaseElement } from './baseElement';
import { htmlUtil } from './htmlUtil';
import { FieldElement } from './fieldElement';

export class RangeElement extends BaseElement {
  public readonly fromView;
  public readonly toView;

  constructor(
    fc: FormController | undefined,
    public readonly range: RangePanel,
    maxWidth: number
  ) {
    super(fc, range, 'range-wrapper', maxWidth);

    this.fromView = new FieldElement(fc, range.fromField as DataField, 0);

    let ele = htmlUtil.getChildElement(this.root, 'from-field');
    ele.appendChild(this.fromView.root);

    this.toView = new FieldElement(fc, range.toField as DataField, 0);
    ele = htmlUtil.getChildElement(this.root, 'to-field');
    ele.appendChild(this.toView.root);
  }
}
