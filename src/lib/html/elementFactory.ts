import {
  AppController,
  Button,
  ButtonPanel,
  Chart,
  DataField,
  FormController,
  PageComponent,
  Panel,
  RangePanel,
  StaticComp,
  TableEditor,
  TableViewer,
  Tabs,
  Value,
} from 'simplity-types';
import { app } from '../controller/app';
import { BaseElement } from './baseElement';
import { ButtonPanelElement } from './buttonPanel';
import { ChartElement } from './chartElement';
import { FieldElement } from './fieldElement';
import { HiddenField } from './hiddenField';
import { LeafElement } from './leafElement';
import { PanelElement } from './panelElement';
import { RangeElement } from './rangeElement';
import { TableEditorElement } from './tableEditorElement';
import { TableViewerElement } from './tableViewerElement';
import { TabsElement } from './tabsElement';

let ac: AppController | undefined;
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
  newElement(
    fc: FormController | undefined,
    comp: PageComponent,
    maxWidth: number,
    value?: Value
  ): BaseElement {
    if (!ac) {
      ac = app.getCurrentAc();
    }
    const view = ac.newViewComponent(fc, comp, maxWidth, value) as BaseElement;
    if (view) {
      console.info(
        `Component '${comp.name}' created at the app-specific factory.`
      );
      return view;
    }

    switch (comp.compType) {
      case 'button':
      case 'static':
        return new LeafElement(fc, comp as Button | StaticComp, maxWidth);

      case 'chart':
        return new ChartElement(fc, comp as Chart, maxWidth);
      case 'field':
        const field = comp as DataField;
        if (field.renderAs === 'hidden') {
          return new HiddenField(fc, field, maxWidth, value);
        }
        return new FieldElement(fc, field, maxWidth, value);

      case 'panel':
        return new PanelElement(fc, comp as Panel, maxWidth);

      case 'buttonPanel':
        return new ButtonPanelElement(fc, comp as ButtonPanel, maxWidth);

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

      case 'range':
        return new RangeElement(fc, comp as RangePanel, maxWidth);
      default:
        throw new Error(
          `Component ${comp.name} has an invalid compType of  ${comp.compType}`
        );
    }
  },
};
