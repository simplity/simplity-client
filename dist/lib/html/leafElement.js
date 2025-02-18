"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeafElement = void 0;
const baseElement_1 = require("./baseElement");
const getTemplateName = (comp) => {
    if (comp.compType == 'button') {
        return 'button';
    }
    const st = comp;
    console.info(`going to create leaf element ${st.name} with type='${st.staticType}' and templateName='${st.templateName}'`);
    return st.staticType || '';
};
/**
 * base class for elements and buttons. These are elements with no children.
 * These elements are allowed to be rendered inside a TablePanel, in which case we have to handle them with their rowId.
 * This base class handles that part.
 */
class LeafElement extends baseElement_1.BaseElement {
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
}
exports.LeafElement = LeafElement;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGVhZkVsZW1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2h0bWwvbGVhZkVsZW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsK0NBQTRDO0FBRzVDLE1BQU0sZUFBZSxHQUFHLENBQUMsSUFBeUIsRUFBeUIsRUFBRTtJQUMzRSxJQUFJLElBQUksQ0FBQyxRQUFRLElBQUksUUFBUSxFQUFFLENBQUM7UUFDOUIsT0FBTyxRQUFRLENBQUM7SUFDbEIsQ0FBQztJQUNELE1BQU0sRUFBRSxHQUFHLElBQWtCLENBQUM7SUFDOUIsT0FBTyxDQUFDLElBQUksQ0FDVixnQ0FBZ0MsRUFBRSxDQUFDLElBQUksZUFBZSxFQUFFLENBQUMsVUFBVSx1QkFBdUIsRUFBRSxDQUFDLFlBQVksR0FBRyxDQUM3RyxDQUFDO0lBQ0YsT0FBTyxFQUFFLENBQUMsVUFBVSxJQUFJLEVBQUUsQ0FBQztBQUM3QixDQUFDLENBQUM7QUFFRjs7OztHQUlHO0FBQ0gsTUFBYSxXQUFZLFNBQVEseUJBQVc7SUFDMUMsWUFDRSxFQUE4QixFQUN2QixJQUF5QixFQUNoQyxRQUFnQjtRQUVoQixLQUFLLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxlQUFlLENBQUMsSUFBSSxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFIMUMsU0FBSSxHQUFKLElBQUksQ0FBcUI7UUFJaEM7O1dBRUc7UUFDSCxJQUFJLFFBQVEsS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3BDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDdkIsSUFBSSxDQUFDLFFBQVEsR0FBRyxTQUFTLENBQUM7UUFDNUIsQ0FBQztJQUNILENBQUM7Q0FDRjtBQWZELGtDQWVDIn0=