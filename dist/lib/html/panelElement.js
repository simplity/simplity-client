"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PanelElement = void 0;
const baseElement_1 = require("./baseElement");
const elementFactory_1 = require("./elementFactory");
const htmlUtil_1 = require("./htmlUtil");
function getTemplateName(panel) {
    if (panel.panelType) {
        return ('panel-' + panel.panelType);
    }
    return 'panel';
}
class PanelElement extends baseElement_1.BaseElement {
    constructor(fc, panel, maxWidth) {
        super(fc, panel, getTemplateName(panel), maxWidth);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFuZWxFbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9odG1sL3BhbmVsRWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSwrQ0FBNEM7QUFDNUMscURBQWtEO0FBQ2xELHlDQUF3RDtBQUV4RCxTQUFTLGVBQWUsQ0FBQyxLQUFZO0lBQ25DLElBQUksS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ3BCLE9BQU8sQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBcUIsQ0FBQztJQUMxRCxDQUFDO0lBQ0QsT0FBTyxPQUFPLENBQUM7QUFDakIsQ0FBQztBQUNELE1BQWEsWUFBYSxTQUFRLHlCQUFXO0lBTTNDLFlBQ0UsRUFBOEIsRUFDZCxLQUFZLEVBQzVCLFFBQWdCO1FBRWhCLEtBQUssQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLGVBQWUsQ0FBQyxLQUFLLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUhuQyxVQUFLLEdBQUwsS0FBSyxDQUFPO1FBSzVCLElBQUksYUFBYSxHQUFHLEVBQUUsQ0FBQztRQUV2Qjs7O1dBR0c7UUFDSCxJQUFJLEtBQUssQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUN4QixNQUFNLElBQUksR0FBUyxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDeEQsSUFBSSxFQUFFLEVBQUUsQ0FBQztnQkFDUCxhQUFhLEdBQUcsRUFBRSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDeEQsQ0FBQztpQkFBTSxDQUFDO2dCQUNOLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUNkLFVBQVUsSUFBSSxDQUFDLElBQUksbUtBQW1LLENBQ3ZMLENBQUM7Z0JBQ0YsYUFBYSxHQUFHLElBQUksQ0FBQyxFQUFFO3FCQUNwQixpQkFBaUIsRUFBRTtxQkFDbkIsaUJBQWlCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN4QyxDQUFDO1lBRUQsb0NBQW9DO1lBQ3BDLElBQUksQ0FBQyxPQUFPLEdBQUcsYUFBYSxDQUFDO1FBQy9CLENBQUM7UUFFRCxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3BCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLElBQUksWUFBWSxDQUFDLENBQUM7WUFDbEQsT0FBTztRQUNULENBQUM7UUFDRDs7V0FFRztRQUNILE1BQU0sU0FBUyxHQUFHLG1CQUFRLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDbkUsS0FBSyxNQUFNLEtBQUssSUFBSSxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDbkMsTUFBTSxHQUFHLEdBQUcsK0JBQWMsQ0FBQyxVQUFVLENBQUMsYUFBYSxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztZQUN0RSxTQUFTLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBQ0QsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDakIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUM5QixDQUFDO0lBQ0gsQ0FBQztDQUNGO0FBcERELG9DQW9EQyJ9