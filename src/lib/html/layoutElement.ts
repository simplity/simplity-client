import {
  AppController,
  Layout,
  Logger,
  MenuItem,
  Module,
  NavigationOptions,
  StringMap,
} from 'simplity-types';
import { PageElement } from './pageElement';
import { app } from '../controller/app';
import { loggerStub } from '../logger-stub/logger';
import { ChildElementId, htmlUtil } from './htmlUtil';
import { ModuleElement } from './moduleElement';

type PageOnStack = { ele: PageElement; scrollTop: number };
const PAGE_TITLE = 'page-title';
/**
 * Only child of AppElement. Defines the over-all layout
 */
export class LayoutElement {
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
  private readonly menuGroups: StringMap<ModuleElement> = {};

  /**
   * keeps track of active pages. Current one is on the top.
   */
  private readonly pageStack: PageOnStack[] = [];

  constructor(
    public readonly layout: Layout,
    options: NavigationOptions
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
      const ele = htmlUtil.getOptionalElement(
        this.root,
        nam as ChildElementId
      ) as HTMLElement;
      if (ele) {
        this.contextEles[nam] = ele;
      }
    }

    this.pageEle = htmlUtil.getChildElement(this.root, 'page');
    this.renderModule(options);
  }

  /**
   *
   */
  renderModule(options: NavigationOptions): void {
    const mn = options.module || this.layout.modules[0];
    const module = this.getInitialModule(mn);
    const menu = this.getInitialMenu(module, options.menuItem);
    if (menu.pageName) {
      this.renderPage(menu.pageName, options);
    } else {
      throw new Error(
        this.reportError(
          `Menu ${menu.name} has no associated page. Initial page can not be rendered`
        )
      );
    }
  }

  renderPage(pageName: string, options: NavigationOptions): void {
    const page = this.ac.getPage(pageName);

    if (options.purgePageStack) {
      this.purgeStack();
    } else {
      const lastEntry = this.pageStack.pop();
      if (lastEntry) {
        if (options.asModal || options.retainCurrentPage) {
          //save the scroll position for us to get back to
          lastEntry.scrollTop = document.documentElement.scrollTop;
          this.pageStack.push(lastEntry); //retain the current page.

          if (!options.asModal) {
            //hide it if not modal
            htmlUtil.setViewState(lastEntry.ele.root, 'hidden', true);
          }
        } else {
          lastEntry.ele.root.remove();
        }
      }
    }

    const pageView = new PageElement(page, options.params || {});
    this.pageStack.push({
      ele: pageView,
      scrollTop: 0,
    });

    if (this.menuBarEle) {
      const toHide = !!page.hideModules;
      htmlUtil.setViewState(this.menuBarEle, 'hidden', toHide);
    }

    this.pageEle.appendChild(pageView.root);
  }

  /**
   * to be called if the page was opened after retaining the earlier page
   */
  public closeCurrentPage(): void {
    let entry = this.pageStack.pop();
    if (!entry) {
      this.logger.error(
        `layout.closeCurrentPage() invoked but there is no page open!!`
      );
      return;
    }
    if (this.pageStack.length === 0) {
      this.logger.error(
        `page '${entry.ele.page.name}' cannot be closed because there is no active page to render. Error in page navigation design`
      );
      return;
    }
    entry.ele.root.remove();

    //show the last page
    entry = this.pageStack[this.pageStack.length - 1];
    htmlUtil.setViewState(entry.ele.root, 'hidden', false);
    if (this.menuBarEle) {
      const toHide = !!entry.ele.page.hideModules;
      htmlUtil.setViewState(this.menuBarEle, 'hidden', toHide);
    }
    window.scrollTo({ top: entry.scrollTop, behavior: 'instant' });
  }

  private purgeStack() {
    for (const entry of this.pageStack) {
      entry.ele.root.remove();
    }
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
      const mg = new ModuleElement(this.ac, module);
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
