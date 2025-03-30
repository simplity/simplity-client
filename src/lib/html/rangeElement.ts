import { DataField, FormController, RangePanel } from 'simplity-types';
import { BaseElement } from './baseElement';
import { htmlUtil } from './htmlUtil';
import { elementFactory } from './elementFactory';
import { FieldElement } from './fieldElement';

export class RangeElement extends BaseElement {
  public readonly fromView: FieldElement;
  public readonly toView: FieldElement;

  constructor(
    fc: FormController | undefined,
    public readonly range: RangePanel,
    maxWidth: number
  ) {
    super(fc, range, 'range-wrapper', maxWidth);

    this.fromView = elementFactory.newElement(
      fc,
      range.fromField as DataField,
      maxWidth
    ) as FieldElement;

    let ele = htmlUtil.getChildElement(this.root, 'from-field');
    ele.appendChild(this.fromView.root);

    this.toView = elementFactory.newElement(
      fc,
      range.toField as DataField,
      maxWidth
    ) as FieldElement;
    ele = htmlUtil.getChildElement(this.root, 'to-field');
    ele.appendChild(this.toView.root);
  }
}
