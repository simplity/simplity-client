import { loggerStub } from '../logger-stub/logger';
import { app } from '../controller/app';
import { htmlUtil } from './htmlUtil';
import {
  AppController,
  BaseComponent,
  BaseView,
  DisplaySettings,
  FormController,
  KnownDisplaySettings,
  NbrCols,
  PageController,
} from 'simplity-types';

const DEFAULT_WIDTH = 4;
/**
 * Base class to be extended by all view components
 * As of now, it is NOT a WebComponent, but a controller that is bound to the root html element.
 * By making this the base class, we have kept the flexibility to refactor them to webComponents later
 * (This approach is similar to Material Design Components of Google.)
 *
 * click event is handled here, while change and changing is handled by the fieldElement
 */
export class BaseElement implements BaseView {
  protected readonly logger = loggerStub.getLogger();
  protected readonly ac: AppController;
  protected readonly pc: PageController;
  /**
   * If this is an input
   */
  protected readonly inputEle?: HTMLInputElement;

  protected labelEle?: HTMLElement;
  /**
   * if this is a container-type of element, like a panel, or tab
   */
  protected readonly containerEle?: HTMLElement;

  public readonly name: string;
  /**
   * root of the html element that this controller manages.
   */
  public readonly root: HTMLElement;

  /**
   *
   * @param table meta data for this view component
   * @param templateName to be used to create the HTML element. ignored if root is provided
   * @param template instance to be cloned as HTML element
   */
  constructor(
    public readonly fc: FormController | undefined,
    public readonly comp: BaseComponent,
    /**
     * mandatory. comp.customHtml, if specified,  will override this.
     */
    templateName: string,
    /**
     * width of the parent in number of columns.
     * 0 means this is inside a column of a row of a table
     */
    protected maxWidth: NbrCols
  ) {
    this.name = comp.name;
    if (fc) {
      this.pc = fc.pc;
      this.ac = this.pc.ac;
    } else {
      this.ac = app.getCurrentAc();
      this.pc = app.getCurrentPc();
    }

    if (templateName === '') {
      this.root = document.createElement('div');
      return;
    }

    this.root = htmlUtil.newHtmlElement(
      comp.customHtml || 'template' + '-' + templateName
    );

    this.containerEle = htmlUtil.getOptionalElement(this.root, 'container');

    if (maxWidth !== 0) {
      /**
       * colSpan for this element. Default for container is full
       */
      let colSpan =
        comp.width || (this.containerEle ? maxWidth : DEFAULT_WIDTH);
      if (colSpan > maxWidth) {
        this.logger
          .error(`Page element '${this.name}' specifies a width of ${colSpan} but the max possible width is only ${maxWidth};
        Page may not render properly`);
        colSpan = maxWidth;
      }
      htmlUtil.setColSpan(this.root, colSpan);
    }

    /**
     * set the number of columns same as colSpan, if this is a container
     */
    if (this.containerEle) {
      htmlUtil.setAsGrid(this.containerEle);
    }

    if (fc) {
      fc.registerChild(this);
      this.root.addEventListener('click', () => {
        this.clicked();
      });
    }
    /**
     *
     * we will handle input control specific aspects in the base element itself
     */
    this.inputEle = this.root.querySelector('input') || undefined;

    if (comp.label) {
      this.labelEle = htmlUtil.getOptionalElement(this.root, 'label');
      if (this.labelEle) {
        this.labelEle.innerText = comp.label;
      } else {
        this.logger.info(
          `node ${comp.name} has a label value of "${comp.label}" bot the html has no element with data-id="label"`
        );
      }
    }
  }

  /**
   * concrete classes should implement this if error is relevant
   * @param msg
   */
  protected setError(msg: unknown): void {
    this.logger.warn(
      `component type ${this.comp.compType} has not implemented setError(), but a request is received with value="${msg}"`
    );
    this.setDataAttr('error', msg === undefined ? undefined : '' + msg);
  }

  setDisplay(settings: DisplaySettings): void {
    for (const [setting, value] of Object.entries(settings)) {
      switch (setting as KnownDisplaySettings | string) {
        case 'error':
          this.setError(value);
          return;

        case 'disabled':
          if (this.inputEle) {
            this.inputEle.disabled = !!value;
            return;
          }
          this.setDataAttr('disabled', value);
          return;

        case 'hidden':
        default:
          this.setDataAttr(setting, value);
      }
    }
  }

  clicked() {
    const action = this.comp.onClick;
    if (action) {
      if (this.fc) {
        this.fc.act(action);
      } else {
        this.pc.act(action);
      }
    }
    /**
     * there could be listeners..
     */
    if (this.fc) {
      this.fc.eventOccurred({
        eventName: 'click',
        viewName: this.name,
        view: this,
        fc: this.fc,
      });
    }
  }
  /**
   *
   * @param attr name of the attribute, (without the data-prefix)
   * @param value undefined to remove the attribute. String, including empty string, to set the value
   * @returns
   */
  protected setDataAttr(attr: string, value: string | undefined): void {
    const att = 'data-' + attr;
    if (value === undefined) {
      this.root.removeAttribute(att);
      return;
    }
    this.root.setAttribute(att, value);
  }
}
