import { loggerStub } from '../logger-stub/logger';
import { app } from '../controller/app';
import { HtmlTemplateName, htmlUtil, ViewState } from './htmlUtil';
import {
  AppController,
  PageComponent,
  BaseView,
  FormController,
  PageController,
  Values,
  ViewInitFunction,
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
  public readonly ac: AppController;
  public readonly pc: PageController;
  /**
   * If this is an input
   */
  public readonly inputEle?: HTMLInputElement;

  /**
   * If this is a container? Added to the base class because it is quite common
   */
  public readonly containerEle?: HTMLElement;
  public labelEle?: HTMLElement;

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
    public readonly comp: PageComponent,
    /**
     * mandatory. comp.customHtml, if specified,  will override this.
     * a ready html element may be supplied instead of a template name
     */
    templateName: HtmlTemplateName | '' | HTMLElement,
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

    if (templateName === '') {
      this.root = document.createElement('div');
      return;
    }

    if (typeof templateName !== 'string') {
      this.root = templateName;
    } else if (comp.templateName) {
      this.root = htmlUtil.newCustomElement(comp.templateName);
    } else {
      this.root = htmlUtil.newHtmlElement(templateName);
    }

    if (fc) {
      fc.registerChild(this);
      this.root.addEventListener('click', () => {
        this.clicked();
      });
    }

    /**
     *
     * input and panel are quite common. Hence added them to the base
     */
    this.inputEle = this.root.querySelector('input') || undefined;
    this.containerEle = htmlUtil.getOptionalElement(this.root, 'container');

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

    /**
     * does this html require custom initialization?
     */
    const att = htmlUtil.getViewState(this.root, 'init');
    if (att) {
      const fnName: string = '' + att;
      const fn = this.ac.getFn(fnName, 'init');
      (fn.fn as ViewInitFunction)(this);
    }

    /**
     * initial display states
     */
    if (comp.displayStates) {
      this.setDisplayState(comp.displayStates);
    }
    /**
     * set colSpan to maxWidth if parent has specified it
     */
    if (maxWidth !== 0) {
      let width = comp.width;
      if (width === undefined) {
        if (htmlUtil.getViewState(this.root, 'full') !== undefined) {
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
      htmlUtil.setViewState(this.root, 'width', width);
      if (this.containerEle) {
        htmlUtil.setViewState(this.containerEle, 'width', width);
      }
    }
  }

  /**
   * concrete classes should implement this if error is relevant
   * @param msg
   */
  public setError(msg: unknown): void {
    this.logger.warn(
      `component type ${this.comp.compType} has not implemented setError(), but a request is received with value="${msg}"`
    );
    htmlUtil.setViewState(this.root, 'invalid', msg !== undefined);
  }

  setDisplayState(settings: Values): void {
    for (const [name, value] of Object.entries(settings)) {
      htmlUtil.setViewState(this.root, name as ViewState, value);
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
}
