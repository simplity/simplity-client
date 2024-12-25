import {
  Button,
  DisplaySettings,
  FormController,
  StaticComp,
} from 'simplity-types';
import { BaseElement } from './baseElement';

const getTemplateName = (comp: StaticComp | Button): string => {
  if (comp.compType == 'button') {
    return 'button';
  }
  return (comp as StaticComp).compType;
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
    public table: StaticComp | Button,
    inColumn?: boolean
  ) {
    super(fc, table, getTemplateName(table));
    /**
     * no labels inside grids
     */
    if (inColumn && this.labelEle) {
      this.labelEle.remove();
      this.labelEle = undefined;
    }
  }

  setDisplay(settings: DisplaySettings): void {
    settings;
  }
}
