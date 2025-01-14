import {
  AppController,
  Layout,
  LayoutView,
  Logger,
  MenuItem,
  Module,
  NavigationParams,
  StringMap,
  Values,
} from 'simplity-types';
import { PageElement } from './pageElement';
import { app } from '../controller/app';
import { loggerStub } from '../logger-stub/logger';
import { htmlUtil } from './htmlUtil';
import { MenuGroupElement } from './menuGroupElement';

const PAGE_TITLE = 'page-title';
/**
 * Only child of AppElement. Defines the over-all layout
 */
export class LayoutElement implements LayoutView {
  public readonly root: HTMLElement;
  private readonly ac: AppController;
  private readonly logger: Logger;
  /*
   * handle to the child elements
   */
  private readonly pageEle: HTMLElement;
  private readonly menuBarEle?: HTMLElement;
  /**
   * html elements for any context-value being rendered in the layout
   */
  private readonly contextEles: StringMap<HTMLElement> = {};

  //private currentModule = '';
  //private lc: LayoutController;
  /**
   * module names mapped to their indexes in the modules[] array
   */
  private readonly moduleMap: { [key: string]: number } = {};
  private readonly menuGroups: StringMap<MenuGroupElement> = {};

  /**
   * undefined before the first page rendered.
   */
  //private currentPageView?: PageElement;

  constructor(
    public readonly layout: Layout,
    params: NavigationParams
  ) {
    this.logger = loggerStub.getLogger();
    this.ac = app.getCurrentAc();

    this.root = htmlUtil.newHtmlElement('layout');

    /*
     * modules are mandatory. however, during development, it could be an empty array
     */

    let names = this.layout.modules || [];
    for (let i = 0; i < names.length; i++) {
      this.moduleMap[names[i]] = i;
    }

    this.menuBarEle = this.renderMenuBar();

    /**
     * hooks for rendering context-values
     */
    names = [PAGE_TITLE];
    if (this.layout.contextNamesToRender) {
      names = [PAGE_TITLE, ...this.layout.contextNamesToRender];
    }

    for (const nam of names) {
      const ele = htmlUtil.getOptionalElement(this.root, nam) as HTMLElement;
      if (ele) {
        this.contextEles[nam] = ele;
      }
    }

    this.pageEle = htmlUtil.getChildElement(this.root, 'page');
    this.renderModule(params);
  }

  /**
   *
   */
  renderModule(params: NavigationParams): void {
    const mn = params.module || this.layout.modules[0];
    const module = this.getInitialModule(mn);
    const menu = this.getInitialMenu(module, params.menuItem);
    if (menu.pageName) {
      this.renderPage(menu.pageName);
    } else {
      throw new Error(
        this.reportError(
          `Menu ${menu.name} has no associated page. Initial page can not be rendered`
        )
      );
    }
  }

  renderPage(pageName: string, params?: Values): void {
    const page = this.ac.getPage(pageName!);

    const pageView = new PageElement(page, params || {});

    //    this.currentPageView = pageView;

    if (this.menuBarEle) {
      if (page.hideModules) {
        this.menuBarEle.setAttribute('data-hidden', '');
      } else {
        this.menuBarEle.removeAttribute('data-hidden');
      }
    }
    htmlUtil.removeChildren(this.pageEle);
    this.pageEle.appendChild(pageView.root);
  }

  private getInitialModule(startWith?: string): Module {
    let module: Module | undefined;
    if (startWith) {
      module = this.ac.getModuleIfAccessible(startWith);
    }

    if (module) {
      return module;
    }

    for (const m of this.layout.modules) {
      module = this.ac.getModule(m);
      if (module) {
        return module;
      }
    }

    //we have to clash a message and go login etc???
    throw new Error(
      this.reportError(
        `Either no modules are set in this layout, or the logged-in user has no access to any module`
      )
    );
  }

  private getInitialMenu(module: Module, menuItem?: string): MenuItem {
    if (menuItem) {
      const item = this.ac.getMenuIfAccessible(menuItem);
      if (item) {
        return item;
      }
      this.logger.error(
        `menuItem ${menuItem} is invalid, or is not accessible. navigating to the next possible menu item instead`
      );
    }

    for (const nam of module.menuItems) {
      const item = this.ac.getMenuIfAccessible(nam);
      if (item) {
        return item;
      }
    }

    throw new Error(
      this.reportError(
        `Either no menu items are set in this module, or the logged-in user has no access to any menu items`
      )
    );
  }

  renderPageTitle(title: string): void {
    const ele = this.contextEles[PAGE_TITLE];
    if (ele) {
      ele.textContent = title;
    } else {
      this.logger.warn(
        'Current layout is not designed to render page title. Page title not rendered'
      );
    }
  }

  renderContextValues(values: StringMap<string>): void {
    for (const [key, value] of Object.entries(values)) {
      const ele = this.contextEles[key];
      if (ele) {
        ele.textContent = value;
      }
    }
  }

  private renderMenuBar(): HTMLElement | undefined {
    const menubar = htmlUtil.getOptionalElement(this.root, 'menu-bar');
    if (!menubar) {
      console.log(this.root);
      this.logger.info(
        `Layout ${this.layout.name} has no child element with data-id="menu-bar". Menu not rendered`
      );
      return;
    }

    for (const moduleName of this.layout.modules) {
      const module = this.ac.getModule(moduleName);
      const mg = new MenuGroupElement(module);
      this.menuGroups[moduleName] = mg;
      const label = htmlUtil.getChildElement(mg.root, 'label');
      if (module.icon) {
        htmlUtil.appendIcon(label, module.icon);
      }
      htmlUtil.appendText(label, module.label);
      menubar.appendChild(mg.root);
    }

    return menubar;
  }

  private reportError(msg: string) {
    this.logger.error(msg);
    return msg;
  }
}
