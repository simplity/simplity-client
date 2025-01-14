"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.elementFactory = void 0;
const leafElement_1 = require("./leafElement");
const fieldElement_1 = require("./fieldElement");
const panelElement_1 = require("./panelElement");
const tabsElement_1 = require("./tabsElement");
const tableViewerElement_1 = require("./tableViewerElement");
const tableEditorElement_1 = require("./tableEditorElement");
const hiddenField_1 = require("./hiddenField");
exports.elementFactory = {
    /**
     * returns an instance of the right view component, or throws an error
     * @param fc
     * @param comp
     * @param maxWidth max width units that the parent can accommodate. This is the actual width of the parent.
     * @param value used as the initial value if this is a field
     * @returns view-component instance
     * @throws Error in case the type of the supplied component is not recognized
     */
    newElement(fc, comp, maxWidth, value) {
        switch (comp.compType) {
            case 'button':
            case 'static':
                return new leafElement_1.LeafElement(fc, comp, maxWidth);
            case 'field':
                const field = comp;
                if (field.renderAs === 'hidden') {
                    return new hiddenField_1.HiddenField(fc, field, maxWidth, value);
                }
                return new fieldElement_1.FieldElement(fc, field, maxWidth, value);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlbWVudEZhY3RvcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2h0bWwvZWxlbWVudEZhY3RvcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBYUEsK0NBQTRDO0FBQzVDLGlEQUE4QztBQUM5QyxpREFBOEM7QUFDOUMsK0NBQTRDO0FBQzVDLDZEQUEwRDtBQUMxRCw2REFBMEQ7QUFDMUQsK0NBQTRDO0FBRS9CLFFBQUEsY0FBYyxHQUFHO0lBQzVCOzs7Ozs7OztPQVFHO0lBQ0gsVUFBVSxDQUNSLEVBQThCLEVBQzlCLElBQW1CLEVBQ25CLFFBQWdCLEVBQ2hCLEtBQWE7UUFFYixRQUFRLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUN0QixLQUFLLFFBQVEsQ0FBQztZQUNkLEtBQUssUUFBUTtnQkFDWCxPQUFPLElBQUkseUJBQVcsQ0FBQyxFQUFFLEVBQUUsSUFBMkIsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUVwRSxLQUFLLE9BQU87Z0JBQ1YsTUFBTSxLQUFLLEdBQUcsSUFBaUIsQ0FBQztnQkFDaEMsSUFBSSxLQUFLLENBQUMsUUFBUSxLQUFLLFFBQVEsRUFBRSxDQUFDO29CQUNoQyxPQUFPLElBQUkseUJBQVcsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDckQsQ0FBQztnQkFDRCxPQUFPLElBQUksMkJBQVksQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUV0RCxLQUFLLE9BQU87Z0JBQ1YsT0FBTyxJQUFJLDJCQUFZLENBQUMsRUFBRSxFQUFFLElBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUV2RCxLQUFLLE1BQU07Z0JBQ1QsT0FBTyxJQUFJLHlCQUFXLENBQUMsRUFBRSxFQUFFLElBQVksRUFBRSxRQUFRLENBQUMsQ0FBQztZQUVyRCxLQUFLLE9BQU87Z0JBQ1YsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUNSLE1BQU0sSUFBSSxLQUFLLENBQ2IseUJBQXlCLElBQUksQ0FBQyxJQUFJLGtFQUFrRSxDQUNyRyxDQUFDO2dCQUNKLENBQUM7Z0JBQ0Q7Ozs7bUJBSUc7Z0JBQ0gsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDaEIsSUFBSSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUM7Z0JBQ3hCLENBQUM7Z0JBQ0QsSUFBSyxJQUFrQyxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUNqRCxPQUFPLElBQUksdUNBQWtCLENBQUMsRUFBRSxFQUFFLElBQW1CLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQ25FLENBQUM7Z0JBQ0QsT0FBTyxJQUFJLHVDQUFrQixDQUFDLEVBQUUsRUFBRSxJQUFtQixFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ25FO2dCQUNFLE1BQU0sSUFBSSxLQUFLLENBQ2IsYUFBYSxJQUFJLENBQUMsSUFBSSxnQ0FBZ0MsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUN0RSxDQUFDO1FBQ04sQ0FBQztJQUNILENBQUM7Q0FDRixDQUFDIn0=