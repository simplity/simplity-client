import { MenuItem } from 'simplity-types';
import { htmlUtil } from './htmlUtil';

export class MenuItemElement {
  readonly root: HTMLElement;
  readonly labelEle: HTMLElement;
  constructor(public readonly menuItem: MenuItem) {
    this.root = htmlUtil.newHtmlElement('menu-item');
    this.labelEle = htmlUtil.getChildElement(this.root, 'label');
    if (menuItem.icon) {
      htmlUtil.appendIcon(this.labelEle, menuItem.icon);
    }
    if (menuItem.label) {
      htmlUtil.appendText(this.labelEle, menuItem.label);
    }
  }
}
