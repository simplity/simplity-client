"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ButtonPanelElement = void 0;
const baseElement_1 = require("./baseElement");
const elementFactory_1 = require("./elementFactory");
const htmlUtil_1 = require("./htmlUtil");
/**
 * button panel renders action buttons, typically at the bottom of a form
 * Current design is to use left, center and right partitions to render three types of buttons.
 * 1. buttons to go back on the left
 * 2. action buttons for this form in the center
 * 3. buttons that take you forward, like next step, on the right
 *
 * this is just a wrapper and is not a component. It's job is to render its child components
 */
class ButtonPanelElement extends baseElement_1.BaseElement {
    constructor(fc, panel, maxWidth) {
        super(fc, panel, 'button-panel', maxWidth);
        this.panel = panel;
        console.info(`Button panel called with maxWidth='${maxWidth}' with attr='${htmlUtil_1.htmlUtil.getDisplayState(this.root, 'full')}'`);
        /**
         * render the three sets of buttons
         */
        for (const [place, buttons] of [
            ['left', panel.leftButtons],
            ['middle', panel.middleButtons],
            ['right', panel.rightButtons],
        ]) {
            if (buttons) {
                const parent = htmlUtil_1.htmlUtil.getChildElement(this.root, place);
                for (const button of buttons) {
                    const ele = elementFactory_1.elementFactory.newElement(fc, button, 0);
                    parent.appendChild(ele.root);
                }
            }
        }
    }
}
exports.ButtonPanelElement = ButtonPanelElement;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnV0dG9uUGFuZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2h0bWwvYnV0dG9uUGFuZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsK0NBQTRDO0FBQzVDLHFEQUFrRDtBQUNsRCx5Q0FBc0M7QUFFdEM7Ozs7Ozs7O0dBUUc7QUFDSCxNQUFhLGtCQUFtQixTQUFRLHlCQUFXO0lBQ2pELFlBQ0UsRUFBOEIsRUFDZCxLQUFrQixFQUNsQyxRQUFnQjtRQUVoQixLQUFLLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxjQUFjLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFIM0IsVUFBSyxHQUFMLEtBQUssQ0FBYTtRQUlsQyxPQUFPLENBQUMsSUFBSSxDQUNWLHNDQUFzQyxRQUFRLGdCQUFnQixtQkFBUSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQzdHLENBQUM7UUFDRjs7V0FFRztRQUNILEtBQUssTUFBTSxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsSUFBSTtZQUM3QixDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsV0FBVyxDQUFDO1lBQzNCLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUM7WUFDL0IsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLFlBQVksQ0FBQztTQUNOLEVBQUUsQ0FBQztZQUMxQixJQUFJLE9BQU8sRUFBRSxDQUFDO2dCQUNaLE1BQU0sTUFBTSxHQUFHLG1CQUFRLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzFELEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxFQUFFLENBQUM7b0JBQzdCLE1BQU0sR0FBRyxHQUFHLCtCQUFjLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQ3JELE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUMvQixDQUFDO1lBQ0gsQ0FBQztRQUNILENBQUM7SUFDSCxDQUFDO0NBQ0Y7QUEzQkQsZ0RBMkJDIn0=