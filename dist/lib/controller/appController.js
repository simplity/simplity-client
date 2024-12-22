"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AC = void 0;
const logger_1 = require("../logger-stub/logger");
const agent_1 = require("../agent/agent");
const util_1 = require("./util");
const app_1 = require("./app");
const parseToValue_1 = require("./parseToValue");
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
    /**
     * all parameters are assumed to be valid.
     * No error handling for any possible invalid parameters
     */
    constructor(
    /**
     * meta-data components for this apps
     */
    runtimeApp, 
    /**
     * This is the root html element for this app.
     */
    appView) {
        this.appView = appView;
        this.validationFns = {};
        //private validPages: StringMap<boolean> = {};
        this.validPagesArray = [];
        this.allowAllMenus = false;
        this.allowedModules = {};
        this.allowedMenus = {};
        this.agent = agent_1.serviceAgent.newAgent({
            localServices: runtimeApp.localServices,
            responses: runtimeApp.cachedResponses,
            serverUrl: runtimeApp.serverUrl,
        });
        //issue in node environment. sessionStorage is just a boolean!!!
        if (global.sessionStorage && global.sessionStorage.getItem) {
            this.context = global.sessionStorage;
        }
        else {
            this.context = simulatedSession;
        }
        this.loginServiceName = runtimeApp.loginServiceName || '';
        this.logoutServiceName = runtimeApp.logoutServiceName || '';
        this.functionDetails = runtimeApp.functionDetails || {};
        this.imageBasePath = runtimeApp.imageBasePath;
        this.allMessages = runtimeApp.messages || {};
        this.listSources = runtimeApp.listSources || {};
        this.allPages = runtimeApp.pages || {};
        this.allForms = runtimeApp.forms || {};
        this.allHtmls = runtimeApp.htmls || {};
        this.allLayouts = runtimeApp.layouts || {};
        this.allModules = runtimeApp.modules || {};
        this.allMenus = runtimeApp.menuItems || {};
        this.validationFns = runtimeApp.validationFns || {};
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
    navigate(action) {
        this.appView.navigate(action);
    }
    selectModule(name) {
        this.appView.navigate({
            name: name,
            type: 'navigation',
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
    isPageValid(page) {
        logger.warn(`isPageValid() not yet implemented. Returning false for page ${page}.`);
        return false;
    }
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
    async serve(serviceName, data) {
        const resp = await this.agent.serve(serviceName, this.sessionId, data);
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
            logger.warn(`${listName} is not a pre-defined list source!!`);
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
        const data = key ? { listName, key } : { listName };
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
            logger.warn(`${listName} is not a pre-defined list source!!`);
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
        const value = (0, parseToValue_1.parseToValue)(textValue, valueType);
        if (value !== undefined) {
            return { value };
        }
        return { messages: [{ alertType: 'error', messageId: 'invalidValue' }] };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwQ29udHJvbGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvY29udHJvbGxlci9hcHBDb250cm9sbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLGtEQUFtRDtBQTBCbkQsMENBQThDO0FBQzlDLGlDQUE4QjtBQUM5QiwrQkFBNEI7QUFDNUIsaURBQThDO0FBRTlDLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQztBQUNyQixNQUFNLE1BQU0sR0FBRyxjQUFjLENBQUM7QUFFOUIsSUFBSSxNQUFNLEdBQUcsbUJBQVUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUVwQzs7R0FFRztBQUNILElBQUksZ0JBQWdCLEdBQXNCLEVBQUUsQ0FBQztBQUM3QyxNQUFNLGdCQUFnQixHQUFZO0lBQ2hDLE9BQU8sRUFBRSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRTtRQUN0QixnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDaEMsQ0FBQztJQUNELE9BQU8sRUFBRSxDQUFDLElBQVksRUFBRSxFQUFFO1FBQ3hCLE1BQU0sSUFBSSxHQUFHLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BDLElBQUksSUFBSSxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQ3ZCLE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQztRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUNELFVBQVUsRUFBRSxDQUFDLElBQVksRUFBRSxFQUFFO1FBQzNCLE9BQU8sZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUNELEtBQUssRUFBRSxHQUFHLEVBQUU7UUFDVixnQkFBZ0IsR0FBRyxFQUFFLENBQUM7SUFDeEIsQ0FBQztDQUNGLENBQUM7QUFFRixNQUFhLEVBQUU7SUEwQ2I7OztPQUdHO0lBQ0g7SUFDRTs7T0FFRztJQUNILFVBQXNCO0lBRXRCOztPQUVHO0lBQ2MsT0FBZ0I7UUFB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