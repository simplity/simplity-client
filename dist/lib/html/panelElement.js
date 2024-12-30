"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PanelElement = void 0;
const baseElement_1 = require("./baseElement");
const elementFactory_1 = require("./elementFactory");
class PanelElement extends baseElement_1.BaseElement {
    constructor(fc, panel, maxWidth) {
        super(fc, panel, 'panel', maxWidth);
        this.panel = panel;
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
            const ele = elementFactory_1.elementFactory.newElement(fc, child, maxWidth);
            this.containerEle.appendChild(ele.root);
        }
    }
}
exports.PanelElement = PanelElement;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFuZWxFbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9odG1sL3BhbmVsRWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFPQSwrQ0FBNEM7QUFDNUMscURBQWtEO0FBQ2xELE1BQWEsWUFBYSxTQUFRLHlCQUFXO0lBTTNDLFlBQ0UsRUFBOEIsRUFDZCxLQUFZLEVBQzVCLFFBQWlCO1FBRWpCLEtBQUssQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztRQUhwQixVQUFLLEdBQUwsS0FBSyxDQUFPO1FBSzVCLElBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUVqQjs7V0FFRztRQUNILElBQUksS0FBSyxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3hCLE1BQU0sSUFBSSxHQUFTLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUN4RCxJQUFJLEVBQUUsRUFBRSxDQUFDO2dCQUNQLE9BQU8sR0FBRyxFQUFFLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNsRCxDQUFDO2lCQUFNLENBQUM7Z0JBQ04sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQ2QsVUFBVSxJQUFJLENBQUMsSUFBSSxtS0FBbUssQ0FDdkwsQ0FBQztnQkFDRixPQUFPLEdBQUcsSUFBSSxDQUFDLEVBQUU7cUJBQ2QsaUJBQWlCLEVBQUU7cUJBQ25CLGlCQUFpQixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDeEMsQ0FBQztZQUNELElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3pCLENBQUM7UUFFRDs7V0FFRztRQUNILEtBQUssTUFBTSxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUN4QyxNQUFNLEdBQUcsR0FBRywrQkFBYyxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzNELElBQUksQ0FBQyxZQUFhLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMzQyxDQUFDO0lBQ0gsQ0FBQztDQUNGO0FBekNELG9DQXlDQyJ9