"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PanelElement = void 0;
const baseElement_1 = require("./baseElement");
const elementFactory_1 = require("./elementFactory");
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
        /**
         * render children
         */
        for (const child of this.panel.children) {
            const ele = elementFactory_1.elementFactory.newElement(fcForChildren, child, maxWidth);
            this.containerEle.appendChild(ele.root);
        }
        if (this.childFc) {
            this.childFc.formRendered();
        }
    }
}
exports.PanelElement = PanelElement;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFuZWxFbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9odG1sL3BhbmVsRWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSwrQ0FBNEM7QUFDNUMscURBQWtEO0FBQ2xELE1BQWEsWUFBYSxTQUFRLHlCQUFXO0lBTTNDLFlBQ0UsRUFBOEIsRUFDZCxLQUFZLEVBQzVCLFFBQWdCO1FBRWhCLEtBQUssQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztRQUhwQixVQUFLLEdBQUwsS0FBSyxDQUFPO1FBSzVCLElBQUksYUFBYSxHQUFHLEVBQUUsQ0FBQztRQUV2Qjs7O1dBR0c7UUFDSCxJQUFJLEtBQUssQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUN4QixNQUFNLElBQUksR0FBUyxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDeEQsSUFBSSxFQUFFLEVBQUUsQ0FBQztnQkFDUCxhQUFhLEdBQUcsRUFBRSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDeEQsQ0FBQztpQkFBTSxDQUFDO2dCQUNOLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUNkLFVBQVUsSUFBSSxDQUFDLElBQUksbUtBQW1LLENBQ3ZMLENBQUM7Z0JBQ0YsYUFBYSxHQUFHLElBQUksQ0FBQyxFQUFFO3FCQUNwQixpQkFBaUIsRUFBRTtxQkFDbkIsaUJBQWlCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN4QyxDQUFDO1lBRUQsb0NBQW9DO1lBQ3BDLElBQUksQ0FBQyxPQUFPLEdBQUcsYUFBYSxDQUFDO1FBQy9CLENBQUM7UUFFRDs7V0FFRztRQUNILEtBQUssTUFBTSxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUN4QyxNQUFNLEdBQUcsR0FBRywrQkFBYyxDQUFDLFVBQVUsQ0FBQyxhQUFhLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3RFLElBQUksQ0FBQyxZQUFhLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMzQyxDQUFDO1FBQ0QsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDakIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUM5QixDQUFDO0lBQ0gsQ0FBQztDQUNGO0FBL0NELG9DQStDQyJ9