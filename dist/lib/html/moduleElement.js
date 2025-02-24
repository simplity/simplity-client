import { htmlUtil } from './htmlUtil';
import { MenuItemElement } from './menuItemElement';
export class ModuleElement {
    ac;
    module;
    root;
    menuItems = {};
    menuEle;
    constructor(ac, module) {
        this.ac = ac;
        this.module = module;
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
//# sourceMappingURL=moduleElement.js.map