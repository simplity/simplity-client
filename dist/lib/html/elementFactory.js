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
    newElement(fc, comp, value, inColumn) {
        switch (comp.compType) {
            case 'button':
            case 'static':
                return new leafElement_1.LeafElement(fc, comp, inColumn);
            case 'field':
                return new fieldElement_1.FieldElement(fc, comp, value, inColumn);
            case 'panel':
                return new panelElement_1.PanelElement(fc, comp);
            case 'tabs':
                return new tabsElement_1.TabsElement(fc, comp);
            case 'table':
                if (!fc) {
                    throw new Error(`A table element named ${comp.name} is embedded inside another table. This feature is not supported`);
                }
                if (comp.editable) {
                    return new tableEditorElement_1.TableEditorElement(fc, comp);
                }
                return new tableViewerElement_1.TableViewerElement(fc, comp);
            default:
                throw new Error(`Component ${comp.name} has an invalid compType of  ${comp.compType}`);
        }
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlbWVudEZhY3RvcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2h0bWwvZWxlbWVudEZhY3RvcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBYUEsK0NBQTRDO0FBQzVDLGlEQUE4QztBQUM5QyxpREFBOEM7QUFDOUMsK0NBQTRDO0FBQzVDLDZEQUEwRDtBQUMxRCw2REFBMEQ7QUFFN0MsUUFBQSxjQUFjLEdBQUc7SUFDNUI7Ozs7Ozs7O09BUUc7SUFDSCxVQUFVLENBQ1IsRUFBOEIsRUFDOUIsSUFBbUIsRUFDbkIsS0FBYSxFQUNiLFFBQWtCO1FBRWxCLFFBQVEsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3RCLEtBQUssUUFBUSxDQUFDO1lBQ2QsS0FBSyxRQUFRO2dCQUNYLE9BQU8sSUFBSSx5QkFBVyxDQUFDLEVBQUUsRUFBRSxJQUEyQixFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBRXBFLEtBQUssT0FBTztnQkFDVixPQUFPLElBQUksMkJBQVksQ0FBQyxFQUFFLEVBQUUsSUFBaUIsRUFBRSxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFFbEUsS0FBSyxPQUFPO2dCQUNWLE9BQU8sSUFBSSwyQkFBWSxDQUFDLEVBQUUsRUFBRSxJQUFhLENBQUMsQ0FBQztZQUU3QyxLQUFLLE1BQU07Z0JBQ1QsT0FBTyxJQUFJLHlCQUFXLENBQUMsRUFBRSxFQUFFLElBQVksQ0FBQyxDQUFDO1lBRTNDLEtBQUssT0FBTztnQkFDVixJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQ1IsTUFBTSxJQUFJLEtBQUssQ0FDYix5QkFBeUIsSUFBSSxDQUFDLElBQUksa0VBQWtFLENBQ3JHLENBQUM7Z0JBQ0osQ0FBQztnQkFDRCxJQUFLLElBQWtDLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQ2pELE9BQU8sSUFBSSx1Q0FBa0IsQ0FBQyxFQUFFLEVBQUUsSUFBbUIsQ0FBQyxDQUFDO2dCQUN6RCxDQUFDO2dCQUNELE9BQU8sSUFBSSx1Q0FBa0IsQ0FBQyxFQUFFLEVBQUUsSUFBbUIsQ0FBQyxDQUFDO1lBQ3pEO2dCQUNFLE1BQU0sSUFBSSxLQUFLLENBQ2IsYUFBYSxJQUFJLENBQUMsSUFBSSxnQ0FBZ0MsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUN0RSxDQUFDO1FBQ04sQ0FBQztJQUNILENBQUM7Q0FDRixDQUFDIn0=