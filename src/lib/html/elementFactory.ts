import {
  Button,
  BaseComponent,
  Panel,
  TableEditor,
  TableViewer,
  Tabs,
  StaticComp,
  DataField,
  Value,
  FormController,
  NbrCols,
} from 'simplity-types';
import { BaseElement } from './baseElement';
import { LeafElement } from './leafElement';
import { FieldElement } from './fieldElement';
import { PanelElement } from './panelElement';
import { TabsElement } from './tabsElement';
import { TableViewerElement } from './tableViewerElement';
import { TableEditorElement } from './tableEditorElement';

export const elementFactory = {
  /**
   * returns an instance of the right view component, or throws an error
   * @param comp
   * @param value used as the initial value if this is a field
   * @param isColumn if true, label is not rendered for this element
   * @param isDisabled if true for a field, the field is rendered as disabled
   * @returns view-component instance
   * @throws Error in case the type of the supplied component is not recognized
   */
  newElement(
    fc: FormController | undefined,
    comp: BaseComponent,
    maxWidth: NbrCols,
    value?: Value
  ): BaseElement {
    switch (comp.compType) {
      case 'button':
      case 'static':
        return new LeafElement(fc, comp as Button | StaticComp, maxWidth);

      case 'field':
        return new FieldElement(fc, comp as DataField, maxWidth, value);

      case 'panel':
        return new PanelElement(fc, comp as Panel, maxWidth);

      case 'tabs':
        return new TabsElement(fc, comp as Tabs, maxWidth);

      case 'table':
        if (!fc) {
          throw new Error(
            `A table element named ${comp.name} is embedded inside another table. This feature is not supported`
          );
        }
        /**
         * for a non-container, default is 4, but it should be 'full' for tables.
         * In a way, table is neither a leaf nor a container
         * TODO: This is the ONLY place where we are changing the attribute of component!!!
         */
        if (!comp.width) {
          comp.width = maxWidth;
        }
        if ((comp as TableEditor | TableViewer).editable) {
          return new TableEditorElement(fc, comp as TableEditor, maxWidth);
        }
        return new TableViewerElement(fc, comp as TableViewer, maxWidth);
      default:
        throw new Error(
          `Component ${comp.name} has an invalid compType of  ${comp.compType}`
        );
    }
  },
};
