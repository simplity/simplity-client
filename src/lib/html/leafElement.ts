import { Button, FormController, StaticComp } from 'simplity-types';
import { BaseElement } from './baseElement';
import { HtmlTemplateName } from './htmlUtil';

const getTemplateName = (comp: StaticComp | Button): HtmlTemplateName | '' => {
  if (comp.compType == 'button') {
    return 'button';
  }
  const name = (comp as StaticComp).staticType;
  if (name === 'custom') {
    return '';
  }
  return name;
};

/**
 * base class for elements and buttons. These are elements with no children.
 * These elements are allowed to be rendered inside a TablePanel, in which case we have to handle them with their rowId.
 * This base class handles that part.
 */
export class LeafElement extends BaseElement {
  /**
   * to be called if this view component is to be available for any run-time changes lik enable/disable
   */
  constructor(
    fc: FormController | undefined,
    public comp: StaticComp | Button,
    maxWidth: number
  ) {
    super(fc, comp, getTemplateName(comp), maxWidth);
    /**
     * no labels inside grids
     */
    if (maxWidth === 0 && this.labelEle) {
      this.labelEle.remove();
      this.labelEle = undefined;
    }
  }
}
