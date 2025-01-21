import { LayoutElement } from './layoutElement';
import {
  Alert,
  AppController,
  ClientRuntime,
  AppView,
  Logger,
  NavigationAction,
  NavigationParams,
  PanelView,
  StringMap,
  Values,
} from 'simplity-types';
import { app } from '../controller/app';
import { loggerStub } from '../logger-stub/logger';
import { htmlUtil } from './htmlUtil';

const PAGE_TITLE = 'page-title';

export class AppElement implements AppView {
  public readonly root: HTMLElement;
  private currentPopup?: PanelView;
  private layoutEle?: LayoutElement;
  private readonly logger: Logger;
  public readonly ac: AppController;

  /**
   *
   * @param runtime
   * @param appEle container element to which the app-view is to be appended to
   */
  constructor(runtime: ClientRuntime, appEle: HTMLElement) {
    this.logger = loggerStub.getLogger();

    this.root = appEle;

    //create the all important and all powerful controller of controllers!!!
    this.ac = app.newAc(runtime, this);

    //render the default layout
    this.renderLayout(runtime.startingLayout, {
      module: runtime.startingModule,
    });
  }

  private renderLayout(layoutName: string, params: NavigationParams): void {
    if (this.layoutEle) {
      if (this.layoutEle.layout.name === layoutName) {
        return;
      }
      this.layoutEle.root.remove();
    }

    const layout = this.ac.getLayout(layoutName);
    const lv = new LayoutElement(layout, params);
    this.layoutEle = lv;
    this.root.appendChild(lv.root);
  }

  navigate(action: NavigationAction): void {
    const p: NavigationParams = {
      menuItem: action.menuItem!,
      module: action.module!,
      params: action.params,
    };

    if (action.layout) {
      this.renderLayout(action.layout, p);
      return;
    }

    if (action.module) {
      this.layoutEle!.renderModule(p);
      return;
    }
    if (!action.menuItem) {
      throw this.ac.newError(
        `Navigation action ${action.name} has no layout/module/menu specified. navigation aborted`
      );
    }
    const menu = this.ac.getMenu(action.menuItem);
    if (!menu.pageName) {
      throw this.ac.newError(
        `Navigation action ${action.name} specifies ${action.menuItem} but that menu has not specified pageName. Navigation aborted`
      );
    }
    console.info(
      `requesting layout to go to page ${menu.pageName} with params:`,
      action.params
    );
    this.layoutEle!.renderPage(menu.pageName, action.params);
  }

  renderContextValues(values: StringMap<string>): void {
    for (const [name, value] of Object.entries(values)) {
      const ele = htmlUtil.getOptionalElement(this.root, name);
      if (ele) {
        ele.textContent = value.toString();
      } else {
        this.logger.info(
          `field ${name} with a value of "${value}" could not be rendered because an element with attribute data-id="${name} was not found in the html document`
        );
      }
    }
  }

  renderPageTitle(title: string): void {
    const values: StringMap<string> = {};
    values[PAGE_TITLE] = title;
    this.renderContextValues(values);
  }

  renderPage(pageName: string, pageParams?: Values): void {
    this.layoutEle!.renderPage(pageName, pageParams);
  }

  showAlert(alert: Alert): void {
    console.info(alert);
    window.alert('alert from app: \n' + JSON.stringify(alert));
  }

  getUserChoice(text: string, choices: string[]): Promise<number> {
    throw new Error(
      `Text: ${text} to be rendered asking for${choices.length} options. This functionality is not yet developed`
    );
  }

  renderAsPopup(panel: PanelView): void {
    if (this.currentPopup) {
      throw new Error(
        `Panel ${panel.name} to be rendered as popup. But panel ${this.currentPopup.name} is already shown as popup`
      );
    }
    this.currentPopup = panel;
    this.logger.warn(
      `Panel ${panel.name} to be rendered as popup. This functionality is not yet developed`
    );
  }

  closePopup(): void {
    if (this.currentPopup) {
      this.currentPopup = undefined;
    } else {
      this.logger.warn(
        `A closePopup() is request when there is no active popup`
      );
    }
  }

  doNavigate(url: string) {
    app.getCurrentAc().newWindow(url);
  }
}
