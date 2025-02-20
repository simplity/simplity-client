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
const buttonPanel_1 = require("./buttonPanel");
const app_1 = require("../controller/app");
let ac;
//let customFactory: ViewFactory | undefined;
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
        if (comp.pluginOptions) {
            console.info(`Component '${comp.name}' requires a plugin from this app.`);
            if (!ac) {
                ac = app_1.app.getCurrentAc();
            }
            return ac.newPluginComponent(fc, comp, maxWidth, value);
        }
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
            case 'buttonPanel':
                return new buttonPanel_1.ButtonPanelElement(fc, comp, maxWidth);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlbWVudEZhY3RvcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2h0bWwvZWxlbWVudEZhY3RvcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBZUEsK0NBQTRDO0FBQzVDLGlEQUE4QztBQUM5QyxpREFBOEM7QUFDOUMsK0NBQTRDO0FBQzVDLDZEQUEwRDtBQUMxRCw2REFBMEQ7QUFDMUQsK0NBQTRDO0FBQzVDLCtDQUFtRDtBQUNuRCwyQ0FBd0M7QUFFeEMsSUFBSSxFQUE2QixDQUFDO0FBQ2xDLDZDQUE2QztBQUNoQyxRQUFBLGNBQWMsR0FBRztJQUM1Qjs7Ozs7Ozs7T0FRRztJQUNILFVBQVUsQ0FDUixFQUE4QixFQUM5QixJQUFtQixFQUNuQixRQUFnQixFQUNoQixLQUFhO1FBRWIsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDdkIsT0FBTyxDQUFDLElBQUksQ0FBQyxjQUFjLElBQUksQ0FBQyxJQUFJLG9DQUFvQyxDQUFDLENBQUM7WUFFMUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNSLEVBQUUsR0FBRyxTQUFHLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDMUIsQ0FBQztZQUNELE9BQU8sRUFBRSxDQUFDLGtCQUFrQixDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBZ0IsQ0FBQztRQUN6RSxDQUFDO1FBRUQsUUFBUSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDdEIsS0FBSyxRQUFRLENBQUM7WUFDZCxLQUFLLFFBQVE7Z0JBQ1gsT0FBTyxJQUFJLHlCQUFXLENBQUMsRUFBRSxFQUFFLElBQTJCLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFFcEUsS0FBSyxPQUFPO2dCQUNWLE1BQU0sS0FBSyxHQUFHLElBQWlCLENBQUM7Z0JBQ2hDLElBQUksS0FBSyxDQUFDLFFBQVEsS0FBSyxRQUFRLEVBQUUsQ0FBQztvQkFDaEMsT0FBTyxJQUFJLHlCQUFXLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3JELENBQUM7Z0JBQ0QsT0FBTyxJQUFJLDJCQUFZLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFdEQsS0FBSyxPQUFPO2dCQUNWLE9BQU8sSUFBSSwyQkFBWSxDQUFDLEVBQUUsRUFBRSxJQUFhLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFFdkQsS0FBSyxhQUFhO2dCQUNoQixPQUFPLElBQUksZ0NBQWtCLENBQUMsRUFBRSxFQUFFLElBQW1CLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFFbkUsS0FBSyxNQUFNO2dCQUNULE9BQU8sSUFBSSx5QkFBVyxDQUFDLEVBQUUsRUFBRSxJQUFZLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFFckQsS0FBSyxPQUFPO2dCQUNWLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDUixNQUFNLElBQUksS0FBSyxDQUNiLHlCQUF5QixJQUFJLENBQUMsSUFBSSxrRUFBa0UsQ0FDckcsQ0FBQztnQkFDSixDQUFDO2dCQUNEOzs7O21CQUlHO2dCQUNILElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ2hCLElBQUksQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDO2dCQUN4QixDQUFDO2dCQUVELElBQUssSUFBa0MsQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDakQsT0FBTyxJQUFJLHVDQUFrQixDQUFDLEVBQUUsRUFBRSxJQUFtQixFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUNuRSxDQUFDO2dCQUNELE9BQU8sSUFBSSx1Q0FBa0IsQ0FBQyxFQUFFLEVBQUUsSUFBbUIsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUNuRTtnQkFDRSxNQUFNLElBQUksS0FBSyxDQUNiLGFBQWEsSUFBSSxDQUFDLElBQUksZ0NBQWdDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FDdEUsQ0FBQztRQUNOLENBQUM7SUFDSCxDQUFDO0NBQ0YsQ0FBQyJ9