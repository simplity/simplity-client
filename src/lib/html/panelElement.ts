import { Form, FormController, Panel } from 'simplity-types';
import { BaseElement } from './baseElement';
import { htmlUtil } from './htmlUtil';
import { elementFactory } from './elementFactory';

export class PanelElement extends BaseElement {
  private readonly contentEle: HTMLElement;
  /**
   * in case this panel is associated with a child-form
   */
  public readonly childFc?: FormController;

  constructor(
    fc: FormController | undefined,
    public readonly panel: Panel
  ) {
    super(fc, panel, 'panel');

    const ele = htmlUtil.getOptionalElement(this.root, 'container');
    this.contentEle = ele || this.root;

    let childFc = fc;

    /**
     * is this a child-form?
     */
    if (panel.childFormName) {
      const form: Form = this.ac.getForm(panel.childFormName);
      if (fc) {
        childFc = fc.newFormController(this.name, form);
      } else {
        this.logger.warn(
          `panel "${this.name}" has a childFormName, but this panel itself is not controlled by a form. The child form-controller will be made a child of teh root-form-controller fo this page`
        );
        childFc = this.pc
          .getFormController()
          .newFormController(this.name, form);
      }
      this.childFc = childFc;
    }

    /**
     * render children
     */
    for (const child of this.panel.children) {
      const ele = elementFactory.newElement(fc, child);
      this.contentEle.appendChild(ele.root);
    }
  }
}
