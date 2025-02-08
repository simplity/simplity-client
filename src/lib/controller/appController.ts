import { loggerStub } from '../logger-stub/logger';
import {
  ClientRuntime,
  AppController,
  Form,
  FunctionDetails,
  Layout,
  ListSource,
  MenuItem,
  Page,
  ServiceAgent,
  StringMap,
  ValueValidationFn,
  ValueValidationResult,
  Values,
  Vo,
  AppView,
  PanelView,
  Module,
  ServiceResponse,
  SimpleList,
  KeyedList,
  ValueType,
  FunctionType,
  ValueSchema,
  NavigationOptions,
  Alert,
} from 'simplity-types';
import { serviceAgent } from '../agent/agent';
import { util } from './util';
import { app } from './app';
import { createValidationFn, parseToValue } from '../validation/validation';
const USER = '_user';
const REGEXP = /\$(\{\d+\})/g;

let logger = loggerStub.getLogger();

/**
 * this is used to simulate Session storage in non-browser environment
 */
let simulatedStorage: StringMap<string> = {};
const simulatedSession: Session = {
  setItem: (name, item) => {
    simulatedStorage[name] = item;
  },
  getItem: (name: string) => {
    const item = simulatedStorage[name];
    if (item === undefined) {
      return null;
    }
    return item;
  },
  removeItem: (name: string) => {
    delete simulatedStorage[name];
  },
  clear: () => {
    simulatedStorage = {};
  },
};

export class AC implements AppController {
  // app components
  private readonly allForms: StringMap<Form>;
  private readonly allPages: StringMap<Page>;
  private readonly functionDetails: StringMap<FunctionDetails>;
  private readonly validationFns: StringMap<ValueValidationFn> = {};
  private readonly allHtmls: StringMap<string>;
  private readonly allModules: StringMap<Module>;
  private readonly allMenus: StringMap<MenuItem>;
  private readonly allLayouts: StringMap<Layout>;
  private readonly listSources: StringMap<ListSource>;

  // app level parameters
  private readonly allMessages: StringMap<string>;
  private readonly loginServiceName;
  private readonly logoutServiceName;
  private readonly imageBasePath;

  /*
   * context for the logged-in user
   */
  private sessionId?: string;
  private readonly context: Session;

  /**
   * access control related
   */
  private validPagesArray: string[] = [];
  private allowAllMenus: boolean = false;
  private allowedModules: StringMap<true> = {};
  private allowedMenus: StringMap<boolean> = {};

  /**
   * agent to communicate with the app-server for services
   * can be a dummy for testing/demo version
   */
  private readonly agent: ServiceAgent;

  public constructor(
    /**
     * meta-data components for this apps
     */
    runtime: ClientRuntime,

    /**
     * This is the root html element for this app.
     */
    private readonly appView: AppView
  ) {
    this.agent = serviceAgent.newAgent({
      localServices: runtime.localServices,
      responses: runtime.cachedResponses,
      serverUrl: runtime.serverUrl,
    });
    //issue in node environment. sessionStorage is just a boolean!!!
    if (global.sessionStorage && (global.sessionStorage as any).getItem) {
      this.context = global.sessionStorage;
    } else {
      this.context = simulatedSession;
    }

    this.loginServiceName = runtime.loginServiceName || '';
    this.logoutServiceName = runtime.logoutServiceName || '';

    this.functionDetails = runtime.functionDetails || {};
    this.imageBasePath = runtime.imageBasePath;

    this.allMessages = runtime.messages || {};
    this.listSources = runtime.listSources || {};
    this.allPages = runtime.pages || {};
    this.allForms = runtime.forms || {};
    this.allHtmls = runtime.htmls || {};

    this.allLayouts = runtime.layouts || {};
    this.allModules = runtime.modules || {};

    this.allMenus = runtime.menuItems || {};
    this.validationFns = this.createValidationFns(runtime.valueSchemas);
  }

  private createValidationFns(
    schemas?: StringMap<ValueSchema>
  ): StringMap<ValueValidationFn> {
    const fns: StringMap<ValueValidationFn> = {};
    if (schemas) {
      for (const [name, schema] of Object.entries(schemas)) {
        fns[name] = createValidationFn(schema);
      }
    }
    return fns;
  }
  newWindow(url: string): void {
    logger.info(
      `Request to open a window for url:${url} received. This feature is not yet implemented`
    );
  }

  closePopup(): void {
    this.appView.closePopup();
  }

  newError(msg: string): Error {
    logger.error(msg);
    return new Error(msg);
  }

  /**
   * use has selected a menu item (outside of page buttons etc.. like from a menu)
   * @param menu
   */
  menuSelected(module: string, menuItem: string): void {
    //TODO: check with pc before demolition!!
    const options: NavigationOptions = {
      module,
      menuItem,
      erasePagesOnTheStack: true,
    };

    this.navigate(options);
  }
  /**
   * request coming from the controller side to navigate to another page
   * @param options
   */
  navigate(options: NavigationOptions): void {
    this.appView.navigate(options);
  }

  selectModule(name: string): void {
    this.appView.navigate({
      module: name,
    });
  }

  getUserChoice(text: string, choices: string[]) {
    return this.appView.getUserChoice(text, choices);
  }

  renderAsPopup(panel: PanelView): void {
    this.appView.renderAsPopup(panel);
  }

  setPageTitle(title: string): void {
    this.appView.renderPageTitle(title);
  }

  disableUx(): void {
    this.appView.disableUx();
  }

  enableUx(): void {
    this.appView.enableUx();
  }

  showAlerts(alerts: Alert[]): void {
    this.appView.showAlerts(alerts);
  }
  isPageValid(page: string): boolean {
    logger.warn(
      `isPageValid() not yet implemented. Returning false for page ${page}.`
    );
    return false;
  }

  // getters for app components
  getLayout(nam: string): Layout {
    const obj = this.allLayouts[nam];
    this.shouldExist(obj, nam, 'layout');
    return obj;
  }

  getModule(nam: string): Module {
    const obj = this.allModules[nam];
    this.shouldExist(obj, nam, 'module');
    return obj;
  }

  getMenu(nam: string): MenuItem {
    const obj = this.allMenus[nam];
    this.shouldExist(obj, nam, 'menu item');
    return obj;
  }

  getModuleIfAccessible(nam: string): Module | undefined {
    const module = this.getModule(nam);
    if (!module) {
      return undefined;
    }

    const hasAccess = this.allowAllMenus || this.allowedModules[nam];
    if (hasAccess) {
      return module;
    }
    for (const item of module.menuItems) {
      const menu = this.allMenus[item];
      if (menu && menu.guestAccess) {
        return module;
      }
    }
    logger.info(`logged in user has no access to the module named ${nam}`);
    return undefined;
  }

  getMenuIfAccessible(nam: string): MenuItem | undefined {
    const menu = this.getMenu(nam);
    const hasAccess =
      menu.guestAccess || this.allowAllMenus || this.allowedMenus[nam];
    if (hasAccess) {
      return menu;
    }

    logger.info(`user  has no access to menu ${nam}`);
    return undefined;
  }

  getPage(nam: string): Page {
    const obj = this.allPages[nam];
    this.shouldExist(obj, nam, 'page');
    return obj;
  }

  getForm(nam: string): Form {
    const obj = this.allForms[nam];
    this.shouldExist(obj, nam, 'form');
    return obj;
  }

  getFn(nam: string, type?: FunctionType): FunctionDetails {
    const obj = this.functionDetails[nam];
    this.shouldExist(obj, nam, 'function');
    if (type && obj.type !== type) {
      const msg = `${nam} is defined as a function of type "${obj.type}" but is being requested for type "${type}"`;
      logger.error(msg);
      throw new Error(msg);
    }
    return obj;
  }

  getImageSrc(imageName: string): string {
    let s = '' + imageName;
    if (s.length > 4) {
      const st = s.substring(0, 6).toLowerCase();
      if (st.startsWith('http:') || st.startsWith('https:')) {
        return imageName;
      }
    }
    return this.imageBasePath + imageName;
  }

  getHtml(htmlName: string): string {
    return this.allHtmls[htmlName] || '';
  }

  getMessage(id: string, params?: string[] | undefined): string {
    const msg = this.allMessages[id];
    if (msg === undefined) {
      return id;
    }
    const p = params || [];
    return msg.replace(REGEXP, (match, id: string) => {
      const txt = id.substring(1, id.length - 1);
      const idx = Number.parseInt(txt, 10);
      const ret = p[idx - 1];
      return ret === undefined ? match : ret;
    });
  }

  //context related functions
  getPermittedPages(): string[] {
    return this.validPagesArray;
  }

  setContextValue(key: string, value: any): void {
    if (value === undefined) {
      this.removeContextValue(key);
      return;
    }
    this.context.setItem(key, JSON.stringify(value));
  }

  removeContextValue(key: string): void {
    this.context.removeItem(key);
  }

  clearContext(): void {
    this.context.clear();
  }

  getContextValue(key: string) {
    const s = this.context.getItem(key);
    if (s === null || s === undefined) {
      return undefined;
    }
    try {
      return JSON.parse(s + '');
      /*
       * defensive code.
       *  setItem() is using JSON.stringify() hence we should never have exception.
       */
    } catch (e) {
      return s;
    }
  }

  getUser(): Vo | undefined {
    return this.getContextValue(USER) as Vo;
  }

  async login(credentials: Values): Promise<boolean> {
    if (!this.loginServiceName) {
      logger.error(
        'loginServiceName is not set for this app, but a request is made for the same'
      );
      return false;
    }

    //remove existing user first
    this.removeContextValue(USER);
    this.setAccessControls('');

    const data = await this.serve(this.loginServiceName, credentials);
    this.afterLogin(data);
    return !!data;
  }

  logout(): void {
    this.removeContextValue(USER);
    this.setAccessControls('');
    this.serve(this.logoutServiceName).then();
  }

  atLeastOneAllowed(ids: string[]): boolean {
    if (this.allowAllMenus) {
      return true;
    }

    for (const id of ids) {
      if (this.allowedMenus[id]) {
        const item = this.allMenus[id];
        if (item && !item.isHidden) {
          return true;
        }
      } else {
        const menu = this.allMenus[id];
        if (menu && menu.guestAccess) {
          return true;
        }
      }
    }

    return false;
  }

  setAccessControls(ids: string): void {
    this.allowedMenus = {};
    this.allowedModules = {};
    this.allowAllMenus = false;
    if (!ids) {
      // no access
      return;
    }
    if (ids === '*') {
      //super user
      this.allowAllMenus = true;
      return;
    }

    for (let id of ids.split(',')) {
      this.allowedMenus[id.trim()] = true;
    }

    for (let [key, mod] of Object.entries(this.allModules)) {
      if (this.atLeastOneAllowed(mod.menuItems)) {
        this.allowedModules[key] = true;
      }
    }
  }

  //server-related
  async serve(
    serviceName: string,
    data?: Vo,
    toDisableUx?: boolean
  ): Promise<ServiceResponse> {
    if (toDisableUx) {
      this.disableUx();
    }
    const resp = await this.agent.serve(serviceName, this.sessionId, data);
    if (toDisableUx) {
      this.disableUx();
    }
    if (resp.status === 'noSuchSession') {
      // TODO: handle server session timeout.
      logger.warn(
        'Server has reported that the current session is not valid anymore.'
      );
      this.sessionId = undefined;
      return resp;
    }
    if (resp.status === 'completed') {
      if (resp.sessionId) {
        this.sessionId = resp.sessionId;
        delete resp.sessionId;
      }

      if (serviceName === this.loginServiceName) {
        console.info('Detected call to login service');
        this.afterLogin(resp.data);
      }
    } else {
      let msgs = resp.messages;
      if (msgs && msgs.length) {
        //error message is sent by the server
      } else {
        resp.messages = [
          { id: resp.status, type: 'error', text: resp.description },
        ];
      }
    }

    return resp;
  }

  async downloadServiceResponse(
    fileName: string,
    serviceName: string,
    data: Vo | undefined
  ): Promise<boolean> {
    const response = await this.agent.serve(serviceName, this.sessionId, data);
    if (response.status !== 'completed') {
      if (response.messages) {
        const msg = response.messages[0];
        logger.error(this.getMessage(msg.id, msg.params));
      } else {
        logger.error(`Service ${serviceName} failed`);
      }
      return false;
    }

    data = response.data;
    if (!data) {
      logger.warn(
        `service ${serviceName} succeeded, but did not return any data. file ${fileName} would be empty`
      );
      data = {};
    }

    util.download(data as Vo, fileName);
    return true;
  }

  async getList(
    listName: string,
    forceRefresh: boolean,
    key?: number | string
  ): Promise<SimpleList> {
    const hasKey = key !== undefined;
    let entry = this.listSources[listName];
    if (!entry) {
      entry = {
        name: listName,
        okToCache: false,
        isKeyed: hasKey,
        isRuntime: true,
      };
      this.listSources[listName] = entry;
    }

    if (entry.isKeyed) {
      //keyed list
      if (!hasKey) {
        logger.error(
          `List ${listName} requires a key field, but no key is specified for this field. empty options returned.`
        );
        return [];
      }

      if (entry.isRuntime) {
        if (entry.keyedList && !forceRefresh) {
          return entry.keyedList[key];
        }
      } else {
        const list = entry.keyedList ? entry.keyedList[key] : undefined;
        if (list) {
          return list;
        }

        logger.error(
          `List ${listName} is a design-time list, but no ready value-list is found`
        );
        return [];
      }
    } else {
      //simple list
      if (entry.isRuntime) {
        if (entry.list && !forceRefresh) {
          return entry.list;
        }
      } else {
        if (entry.list) {
          return entry.list;
        }
        logger.error(
          `List ${listName} is a design-time list, but no ready value-list is found`
        );
        return [];
      }
    }

    const serviceName = app.Conventions.listServiceName;
    const data: Vo = key ? { list: listName, key } : { list: listName };
    //request the server
    const resp = await this.serve(serviceName, data);
    const list = resp.data?.list as SimpleList;

    if (!list) {
      if (resp.status !== 'completed') {
        logger.error(
          `Error while fetching list ${listName}: ${resp.description}\n empty list assumed`
        );
      }
      return [];
    }

    if (entry.okToCache) {
      if (entry.isKeyed) {
        if (!entry.keyedList) {
          entry.keyedList = {};
        }
        entry.keyedList![key!] = list;
      } else {
        entry.list = list;
      }
    }

    return list;
  }

  async getKeyedList(
    listName: string,
    forceRefresh: boolean
  ): Promise<KeyedList> {
    let entry = this.listSources[listName];
    if (!entry) {
      entry = {
        name: listName,
        okToCache: false,
        isKeyed: true,
        isRuntime: true,
      };
      this.listSources[listName] = entry;
    }

    if (!entry.isKeyed) {
      logger.error(
        `List ${listName} is a simple list, but a keyed list is requested for the same. empty object is returned`
      );
      return {};
    }

    if (forceRefresh === false && entry.keyedList) {
      return entry.keyedList;
    }

    const serviceName = app.Conventions.listServiceName;
    const resp = await this.serve(serviceName, { listName });
    const list = resp.data?.list as KeyedList;

    if (!list) {
      if (resp.status !== 'completed') {
        logger.error(
          `Error while fetching list ${listName}: ${resp.description}\n empty list assumed`
        );
      }
      return {};
    }

    if (entry.okToCache) {
      entry.keyedList = list;
    }
    return list;
  }

  validateValue(schemaName: string, value: string): ValueValidationResult {
    const fn = this.validationFns[schemaName];
    if (!fn) {
      return {
        messages: [
          {
            messageId: app.Conventions.errorSchemaIsMissing,
            alertType: 'error',
            params: [schemaName],
          },
        ],
      };
    }
    return fn({ value });
  }

  validateType(valueType: ValueType, textValue: string): ValueValidationResult {
    const value = parseToValue(textValue, valueType);
    if (value !== undefined) {
      return { value };
    }
    return { messages: [{ alertType: 'error', messageId: 'invalidValue' }] };
  }

  /**
   * method to be called after login, if that is done by another component.
   * it is better to call login() of this service instead.
   */
  private afterLogin(user?: Vo) {
    let ids = ''; //no access
    if (user) {
      console.info('User context being created', user);
      this.setContextValue(USER, user);
      const txt = user[app.Conventions.allowedMenuIds];
      if (txt === undefined) {
        ids = '*'; //no restrictions
      } else {
        ids = txt.toString();
      }
    } else {
      console.info('Login service probably failed, as no data is returned');
      this.removeContextValue(USER);
    }
    this.setAccessControls(ids.trim());
  }

  private shouldExist(obj: unknown, nam: string, desc: string): void {
    if (!obj) {
      throw this.newError(`${nam} is not a valid ${desc}`);
    }
  }
}

/**
 * session is to be simulated in case we are not in the browser context
 */
interface Session {
  /**
   * name-value pair is saved in the session.
   * Any existing value with this name is replaced, without any warning
   * @param name
   * @param item
   */
  setItem(name: string, item: string): void;

  /**
   *
   * @param name
   * @returns value saved with this name. undefined if no vale was saved with this name
   */
  getItem(name: string): string | null;

  /**
   * name-value pair, if any, is removed.
   * @param name
   */
  removeItem(name: string): void;
  /**
   * All saved name-value pairs are removed
   */
  clear(): void;
}
