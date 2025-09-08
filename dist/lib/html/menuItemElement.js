"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuItemElement = void 0;
const htmlUtil_1 = require("./htmlUtil");
class MenuItemElement {
    constructor(menuItem) {
        this.menuItem = menuItem;
        this.root = htmlUtil_1.htmlUtil.newHtmlElement('menu-item');
        this.labelEle = htmlUtil_1.htmlUtil.getChildElement(this.root, 'label');
        if (menuItem.icon) {
            htmlUtil_1.htmlUtil.appendIcon(this.labelEle, menuItem.icon);
        }
        if (menuItem.label) {
            htmlUtil_1.htmlUtil.appendText(this.labelEle, menuItem.label);
        }
    }
}
exports.MenuItemElement = MenuItemElement;
//# sourceMappingURL=menuItemElement.js.map