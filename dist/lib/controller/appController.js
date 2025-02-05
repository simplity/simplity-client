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
        logger.error(msg);
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
            erasePagesOnTheStack: true,
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
        if (resp.status === 'noSuchSession') {
            // TODO: handle server session timeout.
            logger.warn('Server has reported that the current session is not valid anymore.');
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
        }
        else {
            let msgs = resp.messages;
            if (msgs && msgs.length) {
                //error message is sent by the server
            }
            else {
                resp.messages = [
                    { id: resp.status, type: 'error', text: resp.description },
                ];
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwQ29udHJvbGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvY29udHJvbGxlci9hcHBDb250cm9sbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLGtEQUFtRDtBQTRCbkQsMENBQThDO0FBQzlDLGlDQUE4QjtBQUM5QiwrQkFBNEI7QUFDNUIseURBQTRFO0FBQzVFLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQztBQUNyQixNQUFNLE1BQU0sR0FBRyxjQUFjLENBQUM7QUFFOUIsSUFBSSxNQUFNLEdBQUcsbUJBQVUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUVwQzs7R0FFRztBQUNILElBQUksZ0JBQWdCLEdBQXNCLEVBQUUsQ0FBQztBQUM3QyxNQUFNLGdCQUFnQixHQUFZO0lBQ2hDLE9BQU8sRUFBRSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRTtRQUN0QixnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDaEMsQ0FBQztJQUNELE9BQU8sRUFBRSxDQUFDLElBQVksRUFBRSxFQUFFO1FBQ3hCLE1BQU0sSUFBSSxHQUFHLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BDLElBQUksSUFBSSxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQ3ZCLE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQztRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUNELFVBQVUsRUFBRSxDQUFDLElBQVksRUFBRSxFQUFFO1FBQzNCLE9BQU8sZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUNELEtBQUssRUFBRSxHQUFHLEVBQUU7UUFDVixnQkFBZ0IsR0FBRyxFQUFFLENBQUM7SUFDeEIsQ0FBQztDQUNGLENBQUM7QUFFRixNQUFhLEVBQUU7SUFzQ2I7SUFDRTs7T0FFRztJQUNILE9BQXNCO0lBRXRCOztPQUVHO0lBQ2MsT0FBZ0I7UUFBaEIsWUFBTyxHQUFQ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