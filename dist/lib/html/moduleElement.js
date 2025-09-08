"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleElement = void 0;
const htmlUtil_1 = require("./htmlUtil");
const menuItemElement_1 = require("./menuItemElement");
class ModuleElement {
    constructor(ac, module) {
        this.ac = ac;
        this.module = module;
        this.menuItems = {};
        this.root = htmlUtil_1.htmlUtil.newHtmlElement('module');
        this.menuEle = htmlUtil_1.htmlUtil.getChildElement(this.root, 'menu-item');
        for (const name of this.module.menuItems) {
            const menu = this.ac.getMenu(name);
            const item = new menuItemElement_1.MenuItemElement(menu);
            this.menuItems[name] = item;
            item.root.addEventListener('click', () => {
                this.ac.menuSelected(this.module.name, name);
            });
            this.menuEle.appendChild(item.root);
        }
    }
}
exports.ModuleElement = ModuleElement;
//# sourceMappingURL=moduleElement.js.map