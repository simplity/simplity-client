"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PanelElement = void 0;
const baseElement_1 = require("./baseElement");
const elementFactory_1 = require("./elementFactory");
const htmlUtil_1 = require("./htmlUtil");
class PanelElement extends baseElement_1.BaseElement {
    constructor(fc, panel, maxWidth) {
        super(fc, panel, 'panel', maxWidth);
        this.panel = panel;
        let fcForChildren = fc;
        /**
         * is this a child-form?
         * then we have to ensure that all the children are rendered under that
         */
        if (panel.childFormName) {
            const form = this.ac.getForm(panel.childFormName);
            if (fc) {
                fcForChildren = fc.newFormController(this.name, form);
            }
            else {
                this.logger.warn(`panel "${this.name}" has a childFormName, but this panel itself is not controlled by a form. The child form-controller will be made a child of teh root-form-controller fo this page`);
                fcForChildren = this.pc
                    .getFormController()
                    .newFormController(this.name, form);
            }
            //fc for child nodes changed to this
            this.childFc = fcForChildren;
        }
        if (!panel.children) {
            this.logger.warn(`panel '${this.name}' is empty`);
            return;
        }
        /**
         * render children
         */
        const container = htmlUtil_1.htmlUtil.getChildElement(this.root, 'container');
        for (const child of panel.children) {
            const ele = elementFactory_1.elementFactory.newElement(fcForChildren, child, maxWidth);
            container.appendChild(ele.root);
        }
        if (this.childFc) {
            this.childFc.formRendered();
        }
    }
}
exports.PanelElement = PanelElement;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFuZWxFbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9odG1sL3BhbmVsRWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSwrQ0FBNEM7QUFDNUMscURBQWtEO0FBQ2xELHlDQUFzQztBQUN0QyxNQUFhLFlBQWEsU0FBUSx5QkFBVztJQU0zQyxZQUNFLEVBQThCLEVBQ2QsS0FBWSxFQUM1QixRQUFnQjtRQUVoQixLQUFLLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFIcEIsVUFBSyxHQUFMLEtBQUssQ0FBTztRQUs1QixJQUFJLGFBQWEsR0FBRyxFQUFFLENBQUM7UUFFdkI7OztXQUdHO1FBQ0gsSUFBSSxLQUFLLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDeEIsTUFBTSxJQUFJLEdBQVMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ3hELElBQUksRUFBRSxFQUFFLENBQUM7Z0JBQ1AsYUFBYSxHQUFHLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3hELENBQUM7aUJBQU0sQ0FBQztnQkFDTixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FDZCxVQUFVLElBQUksQ0FBQyxJQUFJLG1LQUFtSyxDQUN2TCxDQUFDO2dCQUNGLGFBQWEsR0FBRyxJQUFJLENBQUMsRUFBRTtxQkFDcEIsaUJBQWlCLEVBQUU7cUJBQ25CLGlCQUFpQixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDeEMsQ0FBQztZQUVELG9DQUFvQztZQUNwQyxJQUFJLENBQUMsT0FBTyxHQUFHLGFBQWEsQ0FBQztRQUMvQixDQUFDO1FBRUQsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNwQixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLElBQUksQ0FBQyxJQUFJLFlBQVksQ0FBQyxDQUFDO1lBQ2xELE9BQU87UUFDVCxDQUFDO1FBQ0Q7O1dBRUc7UUFDSCxNQUFNLFNBQVMsR0FBRyxtQkFBUSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQ25FLEtBQUssTUFBTSxLQUFLLElBQUksS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ25DLE1BQU0sR0FBRyxHQUFHLCtCQUFjLENBQUMsVUFBVSxDQUFDLGFBQWEsRUFBRSxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDdEUsU0FBUyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUNELElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2pCLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDOUIsQ0FBQztJQUNILENBQUM7Q0FDRjtBQXBERCxvQ0FvREMifQ==