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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kdWxlRWxlbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvaHRtbC9tb2R1bGVFbGVtZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLHlDQUFzQztBQUN0Qyx1REFBb0Q7QUFFcEQsTUFBYSxhQUFhO0lBSXhCLFlBQ21CLEVBQWlCLEVBQ2pCLE1BQWM7UUFEZCxPQUFFLEdBQUYsRUFBRSxDQUFlO1FBQ2pCLFdBQU0sR0FBTixNQUFNLENBQVE7UUFKaEIsY0FBUyxHQUErQixFQUFFLENBQUM7UUFNMUQsSUFBSSxDQUFDLElBQUksR0FBRyxtQkFBUSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM5QyxJQUFJLENBQUMsT0FBTyxHQUFHLG1CQUFRLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFFaEUsS0FBSyxNQUFNLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ3pDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ25DLE1BQU0sSUFBSSxHQUFHLElBQUksaUNBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN2QyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQztZQUM1QixJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUU7Z0JBQ3ZDLElBQUksQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQy9DLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3RDLENBQUM7SUFDSCxDQUFDO0NBQ0Y7QUF0QkQsc0NBc0JDIn0=