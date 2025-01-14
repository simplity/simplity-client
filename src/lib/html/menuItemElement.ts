import { MenuItem } from 'simplity-types';
import { htmlUtil } from './htmlUtil';

export class MenuItemElement {
  readonly root: HTMLElement;
  readonly labelEle: HTMLElement;
  constructor(private readonly comp: MenuItem) {
    this.root = htmlUtil.newHtmlElement('menu-item');
    this.labelEle = htmlUtil.getChildElement(this.root, 'label');
    if (comp.icon) {
      htmlUtil.appendIcon(this.labelEle, comp.icon);
    }
    if (comp.label) {
      htmlUtil.appendText(this.labelEle, comp.label);
    }
    this.comp;
  }
}
