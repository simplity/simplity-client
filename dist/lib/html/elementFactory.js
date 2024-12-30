"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.elementFactory = void 0;
const leafElement_1 = require("./leafElement");
const fieldElement_1 = require("./fieldElement");
const panelElement_1 = require("./panelElement");
const tabsElement_1 = require("./tabsElement");
const tableViewerElement_1 = require("./tableViewerElement");
const tableEditorElement_1 = require("./tableEditorElement");
exports.elementFactory = {
    /**
     * returns an instance of the right view component, or throws an error
     * @param comp
     * @param value used as the initial value if this is a field
     * @param isColumn if true, label is not rendered for this element
     * @param isDisabled if true for a field, the field is rendered as disabled
     * @returns view-component instance
     * @throws Error in case the type of the supplied component is not recognized
     */
    newElement(fc, comp, maxWidth, value) {
        switch (comp.compType) {
            case 'button':
            case 'static':
                return new leafElement_1.LeafElement(fc, comp, maxWidth);
            case 'field':
                return new fieldElement_1.FieldElement(fc, comp, maxWidth, value);
            case 'panel':
                return new panelElement_1.PanelElement(fc, comp, maxWidth);
            case 'tabs':
                return new tabsElement_1.TabsElement(fc, comp, maxWidth);
            case 'table':
                if (!fc) {
                    throw new Error(`A table element named ${comp.name} is embedded inside another table. This feature is not supported`);
                }
                /**
                 * for a non-container, default is 4, but it should be 'full' for tables.
                 * In a way, table is neither a leaf nor a container
                 * TODO: This is the ONLY place where we are changing the attribute of component!!!
                 */
                if (!comp.width) {
                    comp.width = maxWidth;
                }
                if (comp.editable) {
                    return new tableEditorElement_1.TableEditorElement(fc, comp, maxWidth);
                }
                return new tableViewerElement_1.TableViewerElement(fc, comp, maxWidth);
            default:
                throw new Error(`Component ${comp.name} has an invalid compType of  ${comp.compType}`);
        }
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlbWVudEZhY3RvcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2h0bWwvZWxlbWVudEZhY3RvcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBY0EsK0NBQTRDO0FBQzVDLGlEQUE4QztBQUM5QyxpREFBOEM7QUFDOUMsK0NBQTRDO0FBQzVDLDZEQUEwRDtBQUMxRCw2REFBMEQ7QUFFN0MsUUFBQSxjQUFjLEdBQUc7SUFDNUI7Ozs7Ozs7O09BUUc7SUFDSCxVQUFVLENBQ1IsRUFBOEIsRUFDOUIsSUFBbUIsRUFDbkIsUUFBaUIsRUFDakIsS0FBYTtRQUViLFFBQVEsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3RCLEtBQUssUUFBUSxDQUFDO1lBQ2QsS0FBSyxRQUFRO2dCQUNYLE9BQU8sSUFBSSx5QkFBVyxDQUFDLEVBQUUsRUFBRSxJQUEyQixFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBRXBFLEtBQUssT0FBTztnQkFDVixPQUFPLElBQUksMkJBQVksQ0FBQyxFQUFFLEVBQUUsSUFBaUIsRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFbEUsS0FBSyxPQUFPO2dCQUNWLE9BQU8sSUFBSSwyQkFBWSxDQUFDLEVBQUUsRUFBRSxJQUFhLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFFdkQsS0FBSyxNQUFNO2dCQUNULE9BQU8sSUFBSSx5QkFBVyxDQUFDLEVBQUUsRUFBRSxJQUFZLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFFckQsS0FBSyxPQUFPO2dCQUNWLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDUixNQUFNLElBQUksS0FBSyxDQUNiLHlCQUF5QixJQUFJLENBQUMsSUFBSSxrRUFBa0UsQ0FDckcsQ0FBQztnQkFDSixDQUFDO2dCQUNEOzs7O21CQUlHO2dCQUNILElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ2hCLElBQUksQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDO2dCQUN4QixDQUFDO2dCQUNELElBQUssSUFBa0MsQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDakQsT0FBTyxJQUFJLHVDQUFrQixDQUFDLEVBQUUsRUFBRSxJQUFtQixFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUNuRSxDQUFDO2dCQUNELE9BQU8sSUFBSSx1Q0FBa0IsQ0FBQyxFQUFFLEVBQUUsSUFBbUIsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUNuRTtnQkFDRSxNQUFNLElBQUksS0FBSyxDQUNiLGFBQWEsSUFBSSxDQUFDLElBQUksZ0NBQWdDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FDdEUsQ0FBQztRQUNOLENBQUM7SUFDSCxDQUFDO0NBQ0YsQ0FBQyJ9