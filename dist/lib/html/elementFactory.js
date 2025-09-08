"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.elementFactory = void 0;
const app_1 = require("../controller/app");
const buttonPanel_1 = require("./buttonPanel");
const chartElement_1 = require("./chartElement");
const fieldElement_1 = require("./fieldElement");
const hiddenField_1 = require("./hiddenField");
const leafElement_1 = require("./leafElement");
const panelElement_1 = require("./panelElement");
const rangeElement_1 = require("./rangeElement");
const tableEditorElement_1 = require("./tableEditorElement");
const tableViewerElement_1 = require("./tableViewerElement");
const tabsElement_1 = require("./tabsElement");
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
        if (!ac) {
            ac = app_1.app.getCurrentAc();
        }
        const view = ac.newViewComponent(fc, comp, maxWidth, value);
        if (view) {
            console.info(`Component '${comp.name}' created at the app-specific factory.`);
            return view;
        }
        switch (comp.compType) {
            case 'button':
            case 'static':
                return new leafElement_1.LeafElement(fc, comp, maxWidth);
            case 'chart':
                return new chartElement_1.ChartElement(fc, comp, maxWidth);
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
            case 'range':
                return new rangeElement_1.RangeElement(fc, comp, maxWidth);
            default:
                throw new Error(`Component ${comp.name} has an invalid compType of  ${comp.compType}`);
        }
    },
};
//# sourceMappingURL=elementFactory.js.map