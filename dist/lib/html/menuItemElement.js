"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuItemElement = void 0;
const htmlUtil_1 = require("./htmlUtil");
class MenuItemElement {
    constructor(comp) {
        this.comp = comp;
        this.root = htmlUtil_1.htmlUtil.newHtmlElement('menu-item');
        this.labelEle = htmlUtil_1.htmlUtil.getChildElement(this.root, 'label');
        if (comp.icon) {
            htmlUtil_1.htmlUtil.appendIcon(this.labelEle, comp.icon);
        }
        if (comp.label) {
            htmlUtil_1.htmlUtil.appendText(this.labelEle, comp.label);
        }
        this.comp;
    }
}
exports.MenuItemElement = MenuItemElement;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudUl0ZW1FbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9odG1sL21lbnVJdGVtRWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSx5Q0FBc0M7QUFFdEMsTUFBYSxlQUFlO0lBRzFCLFlBQTZCLElBQWM7UUFBZCxTQUFJLEdBQUosSUFBSSxDQUFVO1FBQ3pDLElBQUksQ0FBQyxJQUFJLEdBQUcsbUJBQVEsQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDakQsSUFBSSxDQUFDLFFBQVEsR0FBRyxtQkFBUSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzdELElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ2QsbUJBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDaEQsQ0FBQztRQUNELElBQUksSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2YsbUJBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDakQsQ0FBQztRQUNELElBQUksQ0FBQyxJQUFJLENBQUM7SUFDWixDQUFDO0NBQ0Y7QUFkRCwwQ0FjQyJ9