"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeafElement = void 0;
const baseElement_1 = require("./baseElement");
const getTemplateName = (comp) => {
    if (comp.compType == 'button') {
        return 'button';
    }
    return comp.compType;
};
/**
 * base class for elements and buttons. These are elements with no children.
 * These elements are allowed to be rendered inside a TablePanel, in which case we have to handle them with their rowId.
 * This base class handles that part.
 */
class LeafElement extends baseElement_1.BaseElement {
    /**
     * to be called if this view component is to be available for any run-time changes lik enable/disable
     */
    constructor(fc, comp, maxWidth) {
        super(fc, comp, getTemplateName(comp), maxWidth);
        this.comp = comp;
        /**
         * no labels inside grids
         */
        if (maxWidth === 0 && this.labelEle) {
            this.labelEle.remove();
            this.labelEle = undefined;
        }
    }
    setDisplay(settings) {
        settings;
    }
}
exports.LeafElement = LeafElement;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGVhZkVsZW1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2h0bWwvbGVhZkVsZW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBT0EsK0NBQTRDO0FBRTVDLE1BQU0sZUFBZSxHQUFHLENBQUMsSUFBeUIsRUFBVSxFQUFFO0lBQzVELElBQUksSUFBSSxDQUFDLFFBQVEsSUFBSSxRQUFRLEVBQUUsQ0FBQztRQUM5QixPQUFPLFFBQVEsQ0FBQztJQUNsQixDQUFDO0lBQ0QsT0FBUSxJQUFtQixDQUFDLFFBQVEsQ0FBQztBQUN2QyxDQUFDLENBQUM7QUFFRjs7OztHQUlHO0FBQ0gsTUFBYSxXQUFZLFNBQVEseUJBQVc7SUFDMUM7O09BRUc7SUFDSCxZQUNFLEVBQThCLEVBQ3ZCLElBQXlCLEVBQ2hDLFFBQWlCO1FBRWpCLEtBQUssQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLGVBQWUsQ0FBQyxJQUFJLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUgxQyxTQUFJLEdBQUosSUFBSSxDQUFxQjtRQUloQzs7V0FFRztRQUNILElBQUksUUFBUSxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDcEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUN2QixJQUFJLENBQUMsUUFBUSxHQUFHLFNBQVMsQ0FBQztRQUM1QixDQUFDO0lBQ0gsQ0FBQztJQUVELFVBQVUsQ0FBQyxRQUF5QjtRQUNsQyxRQUFRLENBQUM7SUFDWCxDQUFDO0NBQ0Y7QUF0QkQsa0NBc0JDIn0=