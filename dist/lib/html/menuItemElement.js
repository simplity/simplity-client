import { htmlUtil } from './htmlUtil';
export class MenuItemElement {
    menuItem;
    root;
    labelEle;
    constructor(menuItem) {
        this.menuItem = menuItem;
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
//# sourceMappingURL=menuItemElement.js.map