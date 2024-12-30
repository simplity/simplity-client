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
    /**
     * all parameters are assumed to be valid.
     * No error handling for any possible invalid parameters
     */
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
        //private validPages: StringMap<boolean> = {};
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
        const value = (0, validation_1.parseToValue)(textValue, valueType);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwQ29udHJvbGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvY29udHJvbGxlci9hcHBDb250cm9sbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLGtEQUFtRDtBQTJCbkQsMENBQThDO0FBQzlDLGlDQUE4QjtBQUM5QiwrQkFBNEI7QUFDNUIseURBQTRFO0FBQzVFLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQztBQUNyQixNQUFNLE1BQU0sR0FBRyxjQUFjLENBQUM7QUFFOUIsSUFBSSxNQUFNLEdBQUcsbUJBQVUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUVwQzs7R0FFRztBQUNILElBQUksZ0JBQWdCLEdBQXNCLEVBQUUsQ0FBQztBQUM3QyxNQUFNLGdCQUFnQixHQUFZO0lBQ2hDLE9BQU8sRUFBRSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRTtRQUN0QixnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDaEMsQ0FBQztJQUNELE9BQU8sRUFBRSxDQUFDLElBQVksRUFBRSxFQUFFO1FBQ3hCLE1BQU0sSUFBSSxHQUFHLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BDLElBQUksSUFBSSxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQ3ZCLE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQztRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUNELFVBQVUsRUFBRSxDQUFDLElBQVksRUFBRSxFQUFFO1FBQzNCLE9BQU8sZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUNELEtBQUssRUFBRSxHQUFHLEVBQUU7UUFDVixnQkFBZ0IsR0FBRyxFQUFFLENBQUM7SUFDeEIsQ0FBQztDQUNGLENBQUM7QUFFRixNQUFhLEVBQUU7SUEwQ2I7OztPQUdHO0lBQ0g7SUFDRTs7T0FFRztJQUNILE9BQXNCO0lBRXRCOztPQUVHO0lBQ2MsT0FBZ0I7UUFB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