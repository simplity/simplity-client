"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PanelElement = void 0;
const baseElement_1 = require("./baseElement");
const htmlUtil_1 = require("./htmlUtil");
const elementFactory_1 = require("./elementFactory");
class PanelElement extends baseElement_1.BaseElement {
    constructor(fc, panel) {
        super(fc, panel, 'panel');
        this.panel = panel;
        const ele = htmlUtil_1.htmlUtil.getOptionalElement(this.root, 'container');
        this.contentEle = ele || this.root;
        let childFc = fc;
        /**
         * is this a child-form?
         */
        if (panel.childFormName) {
            const form = this.ac.getForm(panel.childFormName);
            if (fc) {
                childFc = fc.newFormController(this.name, form);
            }
            else {
                this.logger.warn(`panel "${this.name}" has a childFormName, but this panel itself is not controlled by a form. The child form-controller will be made a child of teh root-form-controller fo this page`);
                childFc = this.pc
                    .getFormController()
                    .newFormController(this.name, form);
            }
            this.childFc = childFc;
        }
        /**
         * render children
         */
        for (const child of this.panel.children) {
            const ele = elementFactory_1.elementFactory.newElement(fc, child);
            this.contentEle.appendChild(ele.root);
        }
    }
}
exports.PanelElement = PanelElement;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFuZWxFbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9odG1sL3BhbmVsRWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSwrQ0FBNEM7QUFDNUMseUNBQXNDO0FBQ3RDLHFEQUFrRDtBQUVsRCxNQUFhLFlBQWEsU0FBUSx5QkFBVztJQU8zQyxZQUNFLEVBQThCLEVBQ2QsS0FBWTtRQUU1QixLQUFLLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztRQUZWLFVBQUssR0FBTCxLQUFLLENBQU87UUFJNUIsTUFBTSxHQUFHLEdBQUcsbUJBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQ2hFLElBQUksQ0FBQyxVQUFVLEdBQUcsR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUM7UUFFbkMsSUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBRWpCOztXQUVHO1FBQ0gsSUFBSSxLQUFLLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDeEIsTUFBTSxJQUFJLEdBQVMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ3hELElBQUksRUFBRSxFQUFFLENBQUM7Z0JBQ1AsT0FBTyxHQUFHLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2xELENBQUM7aUJBQU0sQ0FBQztnQkFDTixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FDZCxVQUFVLElBQUksQ0FBQyxJQUFJLG1LQUFtSyxDQUN2TCxDQUFDO2dCQUNGLE9BQU8sR0FBRyxJQUFJLENBQUMsRUFBRTtxQkFDZCxpQkFBaUIsRUFBRTtxQkFDbkIsaUJBQWlCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN4QyxDQUFDO1lBQ0QsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDekIsQ0FBQztRQUVEOztXQUVHO1FBQ0gsS0FBSyxNQUFNLEtBQUssSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3hDLE1BQU0sR0FBRyxHQUFHLCtCQUFjLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNqRCxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDeEMsQ0FBQztJQUNILENBQUM7Q0FDRjtBQTVDRCxvQ0E0Q0MifQ==