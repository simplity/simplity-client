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
    constructor(fc, table, inColumn) {
        super(fc, table, getTemplateName(table));
        this.table = table;
        /**
         * no labels inside grids
         */
        if (inColumn && this.labelEle) {
            this.labelEle.remove();
            this.labelEle = undefined;
        }
    }
    setDisplay(settings) {
        settings;
    }
}
exports.LeafElement = LeafElement;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGVhZkVsZW1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2h0bWwvbGVhZkVsZW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBTUEsK0NBQTRDO0FBRTVDLE1BQU0sZUFBZSxHQUFHLENBQUMsSUFBeUIsRUFBVSxFQUFFO0lBQzVELElBQUksSUFBSSxDQUFDLFFBQVEsSUFBSSxRQUFRLEVBQUUsQ0FBQztRQUM5QixPQUFPLFFBQVEsQ0FBQztJQUNsQixDQUFDO0lBQ0QsT0FBUSxJQUFtQixDQUFDLFFBQVEsQ0FBQztBQUN2QyxDQUFDLENBQUM7QUFFRjs7OztHQUlHO0FBQ0gsTUFBYSxXQUFZLFNBQVEseUJBQVc7SUFDMUM7O09BRUc7SUFDSCxZQUNFLEVBQThCLEVBQ3ZCLEtBQTBCLEVBQ2pDLFFBQWtCO1FBRWxCLEtBQUssQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBSGxDLFVBQUssR0FBTCxLQUFLLENBQXFCO1FBSWpDOztXQUVHO1FBQ0gsSUFBSSxRQUFRLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQzlCLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDdkIsSUFBSSxDQUFDLFFBQVEsR0FBRyxTQUFTLENBQUM7UUFDNUIsQ0FBQztJQUNILENBQUM7SUFFRCxVQUFVLENBQUMsUUFBeUI7UUFDbEMsUUFBUSxDQUFDO0lBQ1gsQ0FBQztDQUNGO0FBdEJELGtDQXNCQyJ9