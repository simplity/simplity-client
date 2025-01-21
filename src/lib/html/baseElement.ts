import { loggerStub } from '../logger-stub/logger';
import { app } from '../controller/app';
import { HtmlTemplateName, htmlUtil } from './htmlUtil';
import {
  AppController,
  BaseComponent,
  BaseView,
  FormController,
  PageController,
  Panel,
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
    templateName: HtmlTemplateName | '',
    /**
     * width of the parent in number of columns.
     * 0 means this is inside a column of a row of a table
     */
    protected maxWidth: number
  ) {
    this.name = comp.name;
    if (fc) {
      this.pc = fc.pc;
      this.ac = this.pc.ac;
    } else {
      this.ac = app.getCurrentAc();
      this.pc = app.getCurrentPc();
    }

    if (comp.customHtml) {
      this.root = htmlUtil.newCustomElement(comp.customHtml);
    } else if (templateName === '') {
      this.root = document.createElement('div');
      return;
    } else {
      this.root = htmlUtil.newHtmlElement(templateName);
    }

    /**
     * set colSpan if maxWidth if parent has specified max-width
     */
    if (maxWidth !== 0) {
      let width = comp.width;
      if (width === undefined) {
        //default for a normal panel is 'full'
        if (
          comp.compType === 'panel' &&
          (comp as Panel).panelType === undefined
        ) {
          width = maxWidth;
        } else if (htmlUtil.getDisplayState(this.root, 'full') !== undefined) {
          //the html root has signalled that it wants full width
          width = maxWidth;
        } else {
          width = DEFAULT_WIDTH;
        }
      }

      if (width > maxWidth) {
        this.logger
          .error(`Page element '${this.name}' specifies a width of ${width} but the max possible width is only ${maxWidth};
        Page may not render properly`);
        width = maxWidth;
      }
      htmlUtil.setDisplayState(this.root, 'width', width);
    }

    if (fc) {
      fc.registerChild(this);
      this.root.addEventListener('click', () => {
        this.clicked();
      });
    }
    /**
     *
     * input element is quite common. adding this simple line to the base itself
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
    htmlUtil.initHtmlEle(this.root, this);
  }

  /**
   * concrete classes should implement this if error is relevant
   * @param msg
   */
  public setError(msg: unknown): void {
    this.logger.warn(
      `component type ${this.comp.compType} has not implemented setError(), but a request is received with value="${msg}"`
    );
    htmlUtil.setDisplayState(this.root, 'error', msg !== undefined);
  }

  setDisplayState(
    stateName: string,
    stateValue: string | number | boolean
  ): void {
    /**
     * we have one special case with inputElement where disabled is a pre-defined attribute to be set/reset
     */
    if (stateName === 'disabled' && this.inputEle) {
      this.inputEle.disabled = !!stateValue;
    }
    htmlUtil.setDisplayState(this.root, stateName, stateValue);
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
}
