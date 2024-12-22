import { FormController, Tabs } from 'simplity-types';
import { BaseElement } from './baseElement';

export class TabsElement extends BaseElement {
  constructor(fc: FormController | undefined, tabs: Tabs) {
    super(fc, tabs, 'tabs');
  }
}
