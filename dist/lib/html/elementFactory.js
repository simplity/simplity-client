import { LeafElement } from './leafElement';
import { FieldElement } from './fieldElement';
import { PanelElement } from './panelElement';
import { TabsElement } from './tabsElement';
import { TableViewerElement } from './tableViewerElement';
import { TableEditorElement } from './tableEditorElement';
import { HiddenField } from './hiddenField';
import { ButtonPanelElement } from './buttonPanel';
import { app } from '../controller/app';
import { ChartElement } from './chartElement';
let ac;
//let customFactory: ViewFactory | undefined;
export const elementFactory = {
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
                ac = app.getCurrentAc();
            }
            return ac.newPluginComponent(fc, comp, maxWidth, value);
        }
        switch (comp.compType) {
            case 'button':
            case 'static':
                return new LeafElement(fc, comp, maxWidth);
            case 'chart':
                return new ChartElement(fc, comp, maxWidth);
            case 'field':
                const field = comp;
                if (field.renderAs === 'hidden') {
                    return new HiddenField(fc, field, maxWidth, value);
                }
                return new FieldElement(fc, field, maxWidth, value);
            case 'panel':
                return new PanelElement(fc, comp, maxWidth);
            case 'buttonPanel':
                return new ButtonPanelElement(fc, comp, maxWidth);
            case 'tabs':
                return new TabsElement(fc, comp, maxWidth);
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
                    return new TableEditorElement(fc, comp, maxWidth);
                }
                return new TableViewerElement(fc, comp, maxWidth);
            default:
                throw new Error(`Component ${comp.name} has an invalid compType of  ${comp.compType}`);
        }
    },
};
//# sourceMappingURL=elementFactory.js.map