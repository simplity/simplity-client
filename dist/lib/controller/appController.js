"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AC = void 0;
const logger_1 = require("../logger-stub/logger");
const agent_1 = require("../agent/agent");
const util_1 = require("./util");
const app_1 = require("./app");
const validation_1 = require("../validation/validation");
const USER = '_user';
const REGEXP = /\$(\{\d+\})/g;
let logger = logger_1.loggerStub.getLogger();
/**
 * this is used to simulate Session storage in non-browser environment
 */
let simulatedStorage = {};
const simulatedSession = {
    setItem: (name, item) => {
        simulatedStorage[name] = item;
    },
    getItem: (name) => {
        const item = simulatedStorage[name];
        if (item === undefined) {
            return null;
        }
        return item;
    },
    removeItem: (name) => {
        delete simulatedStorage[name];
    },
    clear: () => {
        simulatedStorage = {};
    },
};
class AC {
    constructor(
    /**
     * meta-data components for this apps
     */
    runtime, 
    /**
     * This is the root html element for this app.
     */
    appView) {
        this.appView = appView;
        this.validationFns = {};
        /**
         * access control related
         */
        this.validPagesArray = [];
        this.allowAllMenus = false;
        this.allowedModules = {};
        this.allowedMenus = {};
        this.agent = agent_1.serviceAgent.newAgent({
            localServices: runtime.localServices,
            responses: runtime.cachedResponses,
            serverUrl: runtime.serverUrl,
        });
        //issue in node environment. sessionStorage is just a boolean!!!
        if (global.sessionStorage && global.sessionStorage.getItem) {
            this.context = global.sessionStorage;
        }
        else {
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
        if (runtime.onPageLoadAction) {
            this.onPageLoadFn = this.getFn(runtime.onPageLoadAction, 'page')
                .fn;
        }
        if (runtime.onFormRenderAction) {
            this.onFormRenderFn = this.getFn(runtime.onFormRenderAction, 'form')
                .fn;
        }
    }
    pageLoaded(pc) {
        //global hook for the app-client layer
        if (this.onPageLoadFn) {
            this.onPageLoadFn(pc, undefined, []);
        }
    }
    formRendered(fc) {
        //global hook for the app-client layer
        if (this.onFormRenderFn) {
            this.onFormRenderFn(fc, undefined, []);
        }
    }
    createValidationFns(schemas) {
        const fns = {};
        if (schemas) {
            for (const [name, schema] of Object.entries(schemas)) {
                fns[name] = (0, validation_1.createValidationFn)(schema);
            }
        }
        return fns;
    }
    newWindow(url) {
        logger.info(`Request to open a window for url:${url} received. This feature is not yet implemented`);
    }
    closePopup() {
        this.appView.closePopup();
    }
    newError(msg) {
        console.error(msg);
        return new Error(msg);
    }
    /**
     * use has selected a menu item (outside of page buttons etc.. like from a menu)
     * @param menu
     */
    menuSelected(module, menuItem) {
        //TODO: check with pc before demolition!!
        const options = {
            module,
            menuItem,
            purgePageStack: true,
        };
        this.navigate(options);
    }
    /**
     * request coming from the controller side to navigate to another page
     * @param options
     */
    navigate(options) {
        this.appView.navigate(options);
    }
    selectModule(name) {
        this.appView.navigate({
            module: name,
        });
    }
    getUserChoice(text, choices) {
        return this.appView.getUserChoice(text, choices);
    }
    renderAsPopup(panel) {
        this.appView.renderAsPopup(panel);
    }
    setPageTitle(title) {
        this.appView.renderPageTitle(title);
    }
    disableUx() {
        this.appView.disableUx();
    }
    enableUx() {
        this.appView.enableUx();
    }
    showAlerts(alerts) {
        this.appView.showAlerts(alerts);
    }
    isPageValid(page) {
        logger.warn(`isPageValid() not yet implemented. Returning false for page ${page}.`);
        return false;
    }
    // getters for app components
    getLayout(nam) {
        const obj = this.allLayouts[nam];
        this.shouldExist(obj, nam, 'layout');
        return obj;
    }
    getModule(nam) {
        const obj = this.allModules[nam];
        this.shouldExist(obj, nam, 'module');
        return obj;
    }
    getMenu(nam) {
        const obj = this.allMenus[nam];
        this.shouldExist(obj, nam, 'menu item');
        return obj;
    }
    getModuleIfAccessible(nam) {
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
    getMenuIfAccessible(nam) {
        const menu = this.getMenu(nam);
        const hasAccess = menu.guestAccess || this.allowAllMenus || this.allowedMenus[nam];
        if (hasAccess) {
            return menu;
        }
        logger.info(`user  has no access to menu ${nam}`);
        return undefined;
    }
    getPage(nam) {
        const obj = this.allPages[nam];
        this.shouldExist(obj, nam, 'page');
        return obj;
    }
    getForm(nam) {
        const obj = this.allForms[nam];
        this.shouldExist(obj, nam, 'form');
        return obj;
    }
    getFn(nam, type) {
        const obj = this.functionDetails[nam];
        this.shouldExist(obj, nam, 'function');
        if (type && obj.type !== type) {
            const msg = `${nam} is defined as a function of type "${obj.type}" but is being requested for type "${type}"`;
            logger.error(msg);
            throw new Error(msg);
        }
        return obj;
    }
    getImageSrc(imageName) {
        let s = '' + imageName;
        if (s.length > 4) {
            const st = s.substring(0, 6).toLowerCase();
            if (st.startsWith('http:') || st.startsWith('https:')) {
                return imageName;
            }
        }
        return this.imageBasePath + imageName;
    }
    getHtml(htmlName) {
        return this.allHtmls[htmlName] || '';
    }
    getMessage(id, params) {
        const msg = this.allMessages[id];
        if (msg === undefined) {
            return id;
        }
        const p = params || [];
        return msg.replace(REGEXP, (match, id) => {
            const txt = id.substring(1, id.length - 1);
            const idx = Number.parseInt(txt, 10);
            const ret = p[idx - 1];
            return ret === undefined ? match : ret;
        });
    }
    //context related functions
    getPermittedPages() {
        return this.validPagesArray;
    }
    setContextValue(key, value) {
        if (value === undefined) {
            this.removeContextValue(key);
            return;
        }
        this.context.setItem(key, JSON.stringify(value));
    }
    removeContextValue(key) {
        this.context.removeItem(key);
    }
    clearContext() {
        this.context.clear();
    }
    getContextValue(key) {
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
        }
        catch (e) {
            return s;
        }
    }
    getUser() {
        return this.getContextValue(USER);
    }
    async login(credentials) {
        if (!this.loginServiceName) {
            logger.error('loginServiceName is not set for this app, but a request is made for the same');
            return false;
        }
        //remove existing user first
        this.removeContextValue(USER);
        this.setAccessControls('');
        const data = await this.serve(this.loginServiceName, credentials);
        this.afterLogin(data);
        return !!data;
    }
    logout() {
        this.removeContextValue(USER);
        this.setAccessControls('');
        this.serve(this.logoutServiceName).then();
    }
    atLeastOneAllowed(ids) {
        if (this.allowAllMenus) {
            return true;
        }
        for (const id of ids) {
            if (this.allowedMenus[id]) {
                const item = this.allMenus[id];
                if (item && !item.isHidden) {
                    return true;
                }
            }
            else {
                const menu = this.allMenus[id];
                if (menu && menu.guestAccess) {
                    return true;
                }
            }
        }
        return false;
    }
    setAccessControls(ids) {
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
    async serve(serviceName, data, toDisableUx) {
        if (toDisableUx) {
            this.disableUx();
        }
        const resp = await this.agent.serve(serviceName, this.sessionId, data);
        if (toDisableUx) {
            this.disableUx();
        }
        if (resp.sessionId) {
            this.sessionId = resp.sessionId;
            delete resp.sessionId;
        }
        else if (resp.status === 'noSuchSession') {
            // TODO: handle server session timeout.
            logger.warn('Server has reported that the current session is not valid anymore.');
            this.sessionId = undefined;
        }
        //TODO: patch to take care of login as a service instead of login as a command
        if (serviceName === this.loginServiceName) {
            console.info('Detected call to login service');
            this.afterLogin(resp.data);
        }
        else {
            console.info(`service ${serviceName} returned from the server`);
        }
        return resp;
    }
    async downloadServiceResponse(fileName, serviceName, data) {
        const response = await this.agent.serve(serviceName, this.sessionId, data);
        if (response.status !== 'completed') {
            if (response.messages) {
                const msg = response.messages[0];
                logger.error(this.getMessage(msg.id, msg.params));
            }
            else {
                logger.error(`Service ${serviceName} failed`);
            }
            return false;
        }
        data = response.data;
        if (!data) {
            logger.warn(`service ${serviceName} succeeded, but did not return any data. file ${fileName} would be empty`);
            data = {};
        }
        util_1.util.download(data, fileName);
        return true;
    }
    async getList(listName, forceRefresh, key) {
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
                logger.error(`List ${listName} requires a key field, but no key is specified for this field. empty options returned.`);
                return [];
            }
            if (entry.isRuntime) {
                if (entry.keyedList && !forceRefresh) {
                    return entry.keyedList[key];
                }
            }
            else {
                const list = entry.keyedList ? entry.keyedList[key] : undefined;
                if (list) {
                    return list;
                }
                logger.error(`List ${listName} is a design-time list, but no ready value-list is found`);
                return [];
            }
        }
        else {
            //simple list
            if (entry.isRuntime) {
                if (entry.list && !forceRefresh) {
                    return entry.list;
                }
            }
            else {
                if (entry.list) {
                    return entry.list;
                }
                logger.error(`List ${listName} is a design-time list, but no ready value-list is found`);
                return [];
            }
        }
        const serviceName = app_1.app.Conventions.listServiceName;
        const data = key ? { list: listName, key } : { list: listName };
        //request the server
        const resp = await this.serve(serviceName, data);
        const list = resp.data?.list;
        if (!list) {
            if (resp.status !== 'completed') {
                logger.error(`Error while fetching list ${listName}: ${resp.description}\n empty list assumed`);
            }
            return [];
        }
        if (entry.okToCache) {
            if (entry.isKeyed) {
                if (!entry.keyedList) {
                    entry.keyedList = {};
                }
                entry.keyedList[key] = list;
            }
            else {
                entry.list = list;
            }
        }
        return list;
    }
    async getKeyedList(listName, forceRefresh) {
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
            logger.error(`List ${listName} is a simple list, but a keyed list is requested for the same. empty object is returned`);
            return {};
        }
        if (forceRefresh === false && entry.keyedList) {
            return entry.keyedList;
        }
        const serviceName = app_1.app.Conventions.listServiceName;
        const resp = await this.serve(serviceName, { listName });
        const list = resp.data?.list;
        if (!list) {
            if (resp.status !== 'completed') {
                logger.error(`Error while fetching list ${listName}: ${resp.description}\n empty list assumed`);
            }
            return {};
        }
        if (entry.okToCache) {
            entry.keyedList = list;
        }
        return list;
    }
    validateValue(schemaName, value) {
        const fn = this.validationFns[schemaName];
        if (!fn) {
            return {
                messages: [
                    {
                        messageId: app_1.app.Conventions.errorSchemaIsMissing,
                        alertType: 'error',
                        params: [schemaName],
                    },
                ],
            };
        }
        return fn(value);
    }
    validateType(valueType, textValue) {
        const value = (0, validation_1.parseToValue)(textValue, valueType);
        if (value !== undefined) {
            return { value };
        }
        return { messages: [{ alertType: 'error', messageId: 'invalidValue' }] };
    }
    /**
     * method to be called after login, if that is done by another component.
     * it is better to call login() of this service instead.
     */
    afterLogin(user) {
        let ids = ''; //no access
        if (user) {
            console.info('User context being created', user);
            this.setContextValue(USER, user);
            const txt = user[app_1.app.Conventions.allowedMenuIds];
            if (txt === undefined) {
                ids = '*'; //no restrictions
            }
            else {
                ids = txt.toString();
            }
        }
        else {
            console.info('Login service probably failed, as no data is returned');
            this.removeContextValue(USER);
        }
        this.setAccessControls(ids.trim());
    }
    shouldExist(obj, nam, desc) {
        if (!obj) {
            throw this.newError(`${nam} is not a valid ${desc}`);
        }
    }
}
exports.AC = AC;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwQ29udHJvbGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvY29udHJvbGxlci9hcHBDb250cm9sbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLGtEQUFtRDtBQWdDbkQsMENBQThDO0FBQzlDLGlDQUE4QjtBQUM5QiwrQkFBNEI7QUFDNUIseURBQTRFO0FBQzVFLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQztBQUNyQixNQUFNLE1BQU0sR0FBRyxjQUFjLENBQUM7QUFFOUIsSUFBSSxNQUFNLEdBQUcsbUJBQVUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUVwQzs7R0FFRztBQUNILElBQUksZ0JBQWdCLEdBQXNCLEVBQUUsQ0FBQztBQUM3QyxNQUFNLGdCQUFnQixHQUFZO0lBQ2hDLE9BQU8sRUFBRSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRTtRQUN0QixnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDaEMsQ0FBQztJQUNELE9BQU8sRUFBRSxDQUFDLElBQVksRUFBRSxFQUFFO1FBQ3hCLE1BQU0sSUFBSSxHQUFHLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BDLElBQUksSUFBSSxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQ3ZCLE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQztRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUNELFVBQVUsRUFBRSxDQUFDLElBQVksRUFBRSxFQUFFO1FBQzNCLE9BQU8sZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUNELEtBQUssRUFBRSxHQUFHLEVBQUU7UUFDVixnQkFBZ0IsR0FBRyxFQUFFLENBQUM7SUFDeEIsQ0FBQztDQUNGLENBQUM7QUFFRixNQUFhLEVBQUU7SUE0Q2I7SUFDRTs7T0FFRztJQUNILE9BQXNCO0lBRXRCOztPQUVHO0lBQ2MsT0FBZ0I7UUFBaEIsWUFBTyxHQUFQ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