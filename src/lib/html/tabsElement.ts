import { FormController, NbrCols, Tabs } from 'simplity-types';
import { BaseElement } from './baseElement';

export class TabsElement extends BaseElement {
  constructor(fc: FormController | undefined, tabs: Tabs, maxWidth: NbrCols) {
    super(fc, tabs, 'tabs', maxWidth);
  }
}
