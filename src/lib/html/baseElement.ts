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
  PageController,
} from 'simplity-types';

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
  protected readonly inputEle?: HTMLInputElement;
  protected labelEle?: HTMLElement;
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
    public readonly table: BaseComponent,
    templateName?: string
  ) {
    this.name = table.name;
    if (fc) {
      this.pc = fc.pc;
      this.ac = this.pc.ac;
    } else {
      this.ac = app.getCurrentAc();
      this.pc = app.getCurrentPc();
    }
    this.root = htmlUtil.newHtmlElement(
      this.table.customHtml || 'template' + '-' + templateName
    );
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

    if (table.label) {
      this.labelEle = htmlUtil.getOptionalElement(this.root, 'label');
      if (this.labelEle) {
        this.labelEle.innerText = table.label;
      } else {
        this.logger.info(
          `node ${table.name} has a label value of "${table.label}" bot the html has no element with data-id="label"`
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
      `component type ${this.table.compType} has not implemented setError(), but a request is received with value="${msg}"`
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
    const action = this.table.onClick;
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
