"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuGroupElement = void 0;
const htmlUtil_1 = require("./htmlUtil");
const menuItemElement_1 = require("./menuItemElement");
const app_1 = require("../controller/app");
class MenuGroupElement {
    constructor(module) {
        this.module = module;
        this.menuItems = {};
        this.root = htmlUtil_1.htmlUtil.newHtmlElement('menu-group');
        this.menuEle = htmlUtil_1.htmlUtil.getChildElement(this.root, 'menu-item');
        this.ac = app_1.app.getCurrentAc();
        for (const name of this.module.menuItems) {
            const menu = this.ac.getMenu(name);
            const item = new menuItemElement_1.MenuItemElement(menu);
            this.menuItems[name] = item;
            this.menuEle.appendChild(item.root);
        }
    }
}
exports.MenuGroupElement = MenuGroupElement;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudUdyb3VwRWxlbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvaHRtbC9tZW51R3JvdXBFbGVtZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLHlDQUFzQztBQUN0Qyx1REFBb0Q7QUFDcEQsMkNBQXdDO0FBRXhDLE1BQWEsZ0JBQWdCO0lBSzNCLFlBQTZCLE1BQWM7UUFBZCxXQUFNLEdBQU4sTUFBTSxDQUFRO1FBRjFCLGNBQVMsR0FBK0IsRUFBRSxDQUFDO1FBRzFELElBQUksQ0FBQyxJQUFJLEdBQUcsbUJBQVEsQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDbEQsSUFBSSxDQUFDLE9BQU8sR0FBRyxtQkFBUSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQ2hFLElBQUksQ0FBQyxFQUFFLEdBQUcsU0FBRyxDQUFDLFlBQVksRUFBRSxDQUFDO1FBRTdCLEtBQUssTUFBTSxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUN6QyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNuQyxNQUFNLElBQUksR0FBRyxJQUFJLGlDQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdkMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7WUFDNUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3RDLENBQUM7SUFDSCxDQUFDO0NBQ0Y7QUFqQkQsNENBaUJDIn0=