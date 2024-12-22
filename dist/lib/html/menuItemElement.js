"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuItemElement = void 0;
const htmlUtil_1 = require("./htmlUtil");
class MenuItemElement {
    constructor(comp) {
        this.comp = comp;
        this.root = htmlUtil_1.htmlUtil.newHtmlElement('template-menu-item');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudUl0ZW1FbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9odG1sL21lbnVJdGVtRWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSx5Q0FBc0M7QUFFdEMsTUFBYSxlQUFlO0lBRzFCLFlBQTZCLElBQWM7UUFBZCxTQUFJLEdBQUosSUFBSSxDQUFVO1FBQ3pDLElBQUksQ0FBQyxJQUFJLEdBQUcsbUJBQVEsQ0FBQyxjQUFjLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUMxRCxJQUFJLENBQUMsUUFBUSxHQUFHLG1CQUFRLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDN0QsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDZCxtQkFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNoRCxDQUFDO1FBQ0QsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDZixtQkFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqRCxDQUFDO1FBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQztJQUNaLENBQUM7Q0FDRjtBQWRELDBDQWNDIn0=