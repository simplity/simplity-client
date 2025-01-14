import { AppController, Module, StringMap } from 'simplity-types';
import { htmlUtil } from './htmlUtil';
import { MenuItemElement } from './menuItemElement';
import { app } from '../controller/app';

export class MenuGroupElement {
  readonly root: HTMLElement;
  private readonly ac: AppController;
  private readonly menuItems: StringMap<MenuItemElement> = {};
  private readonly menuEle: HTMLElement;
  constructor(private readonly module: Module) {
    this.root = htmlUtil.newHtmlElement('menu-group');
    this.menuEle = htmlUtil.getChildElement(this.root, 'menu-item');
    this.ac = app.getCurrentAc();

    for (const name of this.module.menuItems) {
      const menu = this.ac.getMenu(name);
      const item = new MenuItemElement(menu);
      this.menuItems[name] = item;
      this.menuEle.appendChild(item.root);
    }
  }
}
