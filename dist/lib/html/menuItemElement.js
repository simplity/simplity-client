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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudUl0ZW1FbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9odG1sL21lbnVJdGVtRWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSx5Q0FBc0M7QUFFdEMsTUFBYSxlQUFlO0lBRzFCLFlBQTRCLFFBQWtCO1FBQWxCLGFBQVEsR0FBUixRQUFRLENBQVU7UUFDNUMsSUFBSSxDQUFDLElBQUksR0FBRyxtQkFBUSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNqRCxJQUFJLENBQUMsUUFBUSxHQUFHLG1CQUFRLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDN0QsSUFBSSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDbEIsbUJBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEQsQ0FBQztRQUNELElBQUksUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ25CLG1CQUFRLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3JELENBQUM7SUFDSCxDQUFDO0NBQ0Y7QUFiRCwwQ0FhQyJ9