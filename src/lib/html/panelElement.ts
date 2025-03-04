import { Form, FormController, Panel, PanelView } from 'simplity-types';
import { BaseElement } from './baseElement';
import { elementFactory } from './elementFactory';
import { HtmlTemplateName, htmlUtil } from './htmlUtil';

function getTemplateName(panel: Panel): HtmlTemplateName {
  if (panel.panelType) {
    return ('panel-' + panel.panelType) as HtmlTemplateName;
  }
  return 'panel';
}
export class PanelElement extends BaseElement implements PanelView {
  /**
   * in case this panel is associated with a child-form
   */
  public readonly childFc?: FormController;

  constructor(
    fc: FormController | undefined,
    public readonly panel: Panel,
    maxWidth: number
  ) {
    super(fc, panel, getTemplateName(panel), maxWidth);

    let fcForChildren = fc;

    /**
     * is this a child-form?
     * then we have to ensure that all the children are rendered under that
     */
    if (panel.childFormName) {
      const form: Form = this.ac.getForm(panel.childFormName);
      if (fc) {
        fcForChildren = fc.newFormController(this.name, form);
      } else {
        this.logger.warn(
          `panel "${this.name}" has a childFormName, but this panel itself is not controlled by a form. The child form-controller will be made a child of the root-form-controller fo this page`
        );
        fcForChildren = this.pc
          .getFormController()
          .newFormController(this.name, form);
      }

      //fc for child nodes changed to this
      this.childFc = fcForChildren;
    }

    if (!panel.children) {
      this.logger.warn(`panel '${this.name}' is empty`);
      return;
    }
    /**
     * render children
     */
    const container = htmlUtil.getChildElement(this.root, 'container');
    for (const child of panel.children) {
      const ele = elementFactory.newElement(fcForChildren, child, maxWidth);
      container.appendChild(ele.root);
    }
    if (this.childFc) {
      this.childFc.formRendered();
    }
  }
}
