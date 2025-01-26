import { AppController, Module, StringMap } from 'simplity-types';
import { htmlUtil } from './htmlUtil';
import { MenuItemElement } from './menuItemElement';

export class ModuleElement {
  readonly root: HTMLElement;
  private readonly menuItems: StringMap<MenuItemElement> = {};
  private readonly menuEle: HTMLElement;
  constructor(
    private readonly ac: AppController,
    private readonly module: Module
  ) {
    this.root = htmlUtil.newHtmlElement('module');
    this.menuEle = htmlUtil.getChildElement(this.root, 'menu-item');

    for (const name of this.module.menuItems) {
      const menu = this.ac.getMenu(name);
      const item = new MenuItemElement(menu);
      this.menuItems[name] = item;
      item.root.addEventListener('click', () => {
        this.ac.menuSelected(this.module.name, name);
      });

      this.menuEle.appendChild(item.root);
    }
  }
}
