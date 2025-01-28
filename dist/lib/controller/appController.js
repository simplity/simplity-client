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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwQ29udHJvbGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvY29udHJvbGxlci9hcHBDb250cm9sbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLGtEQUFtRDtBQWdDbkQsMENBQThDO0FBQzlDLGlDQUE4QjtBQUM5QiwrQkFBNEI7QUFDNUIseURBQTRFO0FBQzVFLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQztBQUNyQixNQUFNLE1BQU0sR0FBRyxjQUFjLENBQUM7QUFFOUIsSUFBSSxNQUFNLEdBQUcsbUJBQVUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUVwQzs7R0FFRztBQUNILElBQUksZ0JBQWdCLEdBQXNCLEVBQUUsQ0FBQztBQUM3QyxNQUFNLGdCQUFnQixHQUFZO0lBQ2hDLE9BQU8sRUFBRSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRTtRQUN0QixnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDaEMsQ0FBQztJQUNELE9BQU8sRUFBRSxDQUFDLElBQVksRUFBRSxFQUFFO1FBQ3hCLE1BQU0sSUFBSSxHQUFHLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BDLElBQUksSUFBSSxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQ3ZCLE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQztRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUNELFVBQVUsRUFBRSxDQUFDLElBQVksRUFBRSxFQUFFO1FBQzNCLE9BQU8sZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUNELEtBQUssRUFBRSxHQUFHLEVBQUU7UUFDVixnQkFBZ0IsR0FBRyxFQUFFLENBQUM7SUFDeEIsQ0FBQztDQUNGLENBQUM7QUFFRixNQUFhLEVBQUU7SUE0Q2I7SUFDRTs7T0FFRztJQUNILE9BQXNCO0lBRXRCOztPQUVHO0lBQ2MsT0FBZ0I7UUFBaEIsWUFBTyxHQUFQLE9BQU8sQ0FBUztRQWhEbEIsa0JBQWEsR0FBaUMsRUFBRSxDQUFDO1FBbUJsRTs7V0FFRztRQUNLLG9CQUFlLEdBQWEsRUFBRSxDQUFDO1FBQy9CLGtCQUFhLEdBQVksS0FBSyxDQUFDO1FBQy9CLG1CQUFjLEdBQW9CLEVBQUUsQ0FBQztRQUNyQyxpQkFBWSxHQUF1QixFQUFFLENBQUM7UUF5QjVDLElBQUksQ0FBQyxLQUFLLEdBQUcsb0JBQVksQ0FBQyxRQUFRLENBQUM7WUFDakMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxhQUFhO1lBQ3BDLFNBQVMsRUFBRSxPQUFPLENBQUMsZUFBZTtZQUNsQyxTQUFTLEVBQUUsT0FBTyxDQUFDLFNBQVM7U0FDN0IsQ0FBQyxDQUFDO1FBQ0gsZ0VBQWdFO1FBQ2hFLElBQUksTUFBTSxDQUFDLGNBQWMsSUFBSyxNQUFNLENBQUMsY0FBc0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNwRSxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUM7UUFDdkMsQ0FBQzthQUFNLENBQUM7WUFDTixJQUFJLENBQUMsT0FBTyxHQUFHLGdCQUFnQixDQUFDO1FBQ2xDLENBQUM7UUFFRCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixJQUFJLEVBQUUsQ0FBQztRQUN2RCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixJQUFJLEVBQUUsQ0FBQztRQUV6RCxJQUFJLENBQUMsZUFBZSxHQUFHLE9BQU8sQ0FBQyxlQUFlLElBQUksRUFBRSxDQUFDO1FBQ3JELElBQUksQ0FBQyxhQUFhLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQztRQUUzQyxJQUFJLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDO1FBQzFDLElBQUksQ0FBQyxXQUFXLEdBQUcsT0FBTyxDQUFDLFdBQVcsSUFBSSxFQUFFLENBQUM7UUFDN0MsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQztRQUNwQyxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDO1FBQ3BDLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUM7UUFFcEMsSUFBSSxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQztRQUN4QyxJQUFJLENBQUMsVUFBVSxHQUFHLE9BQU8sQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFDO1FBRXhDLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLFNBQVMsSUFBSSxFQUFFLENBQUM7UUFDeEMsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBRXBFLElBQUksT0FBTyxDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFDN0IsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxNQUFNLENBQUM7aUJBQzdELEVBQWtCLENBQUM7UUFDeEIsQ0FBQztRQUVELElBQUksT0FBTyxDQUFDLGtCQUFrQixFQUFFLENBQUM7WUFDL0IsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxNQUFNLENBQUM7aUJBQ2pFLEVBQWtCLENBQUM7UUFDeEIsQ0FBQztJQUNILENBQUM7SUFFRCxVQUFVLENBQUMsRUFBa0I7UUFDM0Isc0NBQXNDO1FBQ3RDLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxFQUFFLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN2QyxDQUFDO0lBQ0gsQ0FBQztJQUVELFlBQVksQ0FBQyxFQUFrQjtRQUM3QixzQ0FBc0M7UUFDdEMsSUFBSSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDeEIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxFQUFFLEVBQUUsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3pDLENBQUM7SUFDSCxDQUFDO0lBRU8sbUJBQW1CLENBQ3pCLE9BQWdDO1FBRWhDLE1BQU0sR0FBRyxHQUFpQyxFQUFFLENBQUM7UUFDN0MsSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUNaLEtBQUssTUFBTSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ3JELEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFBLCtCQUFrQixFQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3pDLENBQUM7UUFDSCxDQUFDO1FBQ0QsT0FBTyxHQUFHLENBQUM7SUFDYixDQUFDO0lBQ0QsU0FBUyxDQUFDLEdBQVc7UUFDbkIsTUFBTSxDQUFDLElBQUksQ0FDVCxvQ0FBb0MsR0FBRyxnREFBZ0QsQ0FDeEYsQ0FBQztJQUNKLENBQUM7SUFFRCxVQUFVO1FBQ1IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztJQUM1QixDQUFDO0lBRUQsUUFBUSxDQUFDLEdBQVc7UUFDbEIsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNuQixPQUFPLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3hCLENBQUM7SUFFRDs7O09BR0c7SUFDSCxZQUFZLENBQUMsTUFBYyxFQUFFLFFBQWdCO1FBQzNDLHlDQUF5QztRQUN6QyxNQUFNLE9BQU8sR0FBc0I7WUFDakMsTUFBTTtZQUNOLFFBQVE7WUFDUixvQkFBb0IsRUFBRSxJQUFJO1NBQzNCLENBQUM7UUFFRixJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3pCLENBQUM7SUFDRDs7O09BR0c7SUFDSCxRQUFRLENBQUMsT0FBMEI7UUFDakMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDakMsQ0FBQztJQUVELFlBQVksQ0FBQyxJQUFZO1FBQ3ZCLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDO1lBQ3BCLE1BQU0sRUFBRSxJQUFJO1NBQ2IsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELGFBQWEsQ0FBQyxJQUFZLEVBQUUsT0FBaUI7UUFDM0MsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDbkQsQ0FBQztJQUVELGFBQWEsQ0FBQyxLQUFnQjtRQUM1QixJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNwQyxDQUFDO0lBRUQsWUFBWSxDQUFDLEtBQWE7UUFDeEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUVELFNBQVM7UUFDUCxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDO0lBQzNCLENBQUM7SUFFRCxRQUFRO1FBQ04sSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUMxQixDQUFDO0lBRUQsVUFBVSxDQUFDLE1BQWU7UUFDeEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQUNELFdBQVcsQ0FBQyxJQUFZO1FBQ3RCLE1BQU0sQ0FBQyxJQUFJLENBQ1QsK0RBQStELElBQUksR0FBRyxDQUN2RSxDQUFDO1FBQ0YsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRUQsNkJBQTZCO0lBQzdCLFNBQVMsQ0FBQyxHQUFXO1FBQ25CLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDakMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3JDLE9BQU8sR0FBRyxDQUFDO0lBQ2IsQ0FBQztJQUVELFNBQVMsQ0FBQyxHQUFXO1FBQ25CLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDakMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3JDLE9BQU8sR0FBRyxDQUFDO0lBQ2IsQ0FBQztJQUVELE9BQU8sQ0FBQyxHQUFXO1FBQ2pCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDL0IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQ3hDLE9BQU8sR0FBRyxDQUFDO0lBQ2IsQ0FBQztJQUVELHFCQUFxQixDQUFDLEdBQVc7UUFDL0IsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNuQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDWixPQUFPLFNBQVMsQ0FBQztRQUNuQixDQUFDO1FBRUQsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLGFBQWEsSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2pFLElBQUksU0FBUyxFQUFFLENBQUM7WUFDZCxPQUFPLE1BQU0sQ0FBQztRQUNoQixDQUFDO1FBQ0QsS0FBSyxNQUFNLElBQUksSUFBSSxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDcEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNqQyxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQzdCLE9BQU8sTUFBTSxDQUFDO1lBQ2hCLENBQUM7UUFDSCxDQUFDO1FBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQyxvREFBb0QsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUN2RSxPQUFPLFNBQVMsQ0FBQztJQUNuQixDQUFDO0lBRUQsbUJBQW1CLENBQUMsR0FBVztRQUM3QixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQy9CLE1BQU0sU0FBUyxHQUNiLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLGFBQWEsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ25FLElBQUksU0FBUyxFQUFFLENBQUM7WUFDZCxPQUFPLElBQUksQ0FBQztRQUNkLENBQUM7UUFFRCxNQUFNLENBQUMsSUFBSSxDQUFDLCtCQUErQixHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQ2xELE9BQU8sU0FBUyxDQUFDO0lBQ25CLENBQUM7SUFFRCxPQUFPLENBQUMsR0FBVztRQUNqQixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQy9CLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNuQyxPQUFPLEdBQUcsQ0FBQztJQUNiLENBQUM7SUFFRCxPQUFPLENBQUMsR0FBVztRQUNqQixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQy9CLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNuQyxPQUFPLEdBQUcsQ0FBQztJQUNiLENBQUM7SUFFRCxLQUFLLENBQUMsR0FBVyxFQUFFLElBQW1CO1FBQ3BDLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ3ZDLElBQUksSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssSUFBSSxFQUFFLENBQUM7WUFDOUIsTUFBTSxHQUFHLEdBQUcsR0FBRyxHQUFHLHNDQUFzQyxHQUFHLENBQUMsSUFBSSxzQ0FBc0MsSUFBSSxHQUFHLENBQUM7WUFDOUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNsQixNQUFNLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZCLENBQUM7UUFDRCxPQUFPLEdBQUcsQ0FBQztJQUNiLENBQUM7SUFFRCxXQUFXLENBQUMsU0FBaUI7UUFDM0IsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLFNBQVMsQ0FBQztRQUN2QixJQUFJLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDakIsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDM0MsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDdEQsT0FBTyxTQUFTLENBQUM7WUFDbkIsQ0FBQztRQUNILENBQUM7UUFDRCxPQUFPLElBQUksQ0FBQyxhQUFhLEdBQUcsU0FBUyxDQUFDO0lBQ3hDLENBQUM7SUFFRCxPQUFPLENBQUMsUUFBZ0I7UUFDdEIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUN2QyxDQUFDO0lBRUQsVUFBVSxDQUFDLEVBQVUsRUFBRSxNQUE2QjtRQUNsRCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2pDLElBQUksR0FBRyxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQ3RCLE9BQU8sRUFBRSxDQUFDO1FBQ1osQ0FBQztRQUNELE1BQU0sQ0FBQyxHQUFHLE1BQU0sSUFBSSxFQUFFLENBQUM7UUFDdkIsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFVLEVBQUUsRUFBRTtZQUMvQyxNQUFNLEdBQUcsR0FBRyxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzNDLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3JDLE1BQU0sR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDdkIsT0FBTyxHQUFHLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztRQUN6QyxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCwyQkFBMkI7SUFDM0IsaUJBQWlCO1FBQ2YsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDO0lBQzlCLENBQUM7SUFFRCxlQUFlLENBQUMsR0FBVyxFQUFFLEtBQVU7UUFDckMsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDeEIsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzdCLE9BQU87UUFDVCxDQUFDO1FBQ0QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUNuRCxDQUFDO0lBRUQsa0JBQWtCLENBQUMsR0FBVztRQUM1QixJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBRUQsWUFBWTtRQUNWLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDdkIsQ0FBQztJQUVELGVBQWUsQ0FBQyxHQUFXO1FBQ3pCLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3BDLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDbEMsT0FBTyxTQUFTLENBQUM7UUFDbkIsQ0FBQztRQUNELElBQUksQ0FBQztZQUNILE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDMUI7OztlQUdHO1FBQ0wsQ0FBQztRQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDWCxPQUFPLENBQUMsQ0FBQztRQUNYLENBQUM7SUFDSCxDQUFDO0lBRUQsT0FBTztRQUNMLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQU8sQ0FBQztJQUMxQyxDQUFDO0lBRUQsS0FBSyxDQUFDLEtBQUssQ0FBQyxXQUFtQjtRQUM3QixJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFDM0IsTUFBTSxDQUFDLEtBQUssQ0FDViw4RUFBOEUsQ0FDL0UsQ0FBQztZQUNGLE9BQU8sS0FBSyxDQUFDO1FBQ2YsQ0FBQztRQUVELDRCQUE0QjtRQUM1QixJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDOUIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRTNCLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDbEUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN0QixPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVELE1BQU07UUFDSixJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDOUIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzNCLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDNUMsQ0FBQztJQUVELGlCQUFpQixDQUFDLEdBQWE7UUFDN0IsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDdkIsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDO1FBRUQsS0FBSyxNQUFNLEVBQUUsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUNyQixJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQkFDMUIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDL0IsSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQzNCLE9BQU8sSUFBSSxDQUFDO2dCQUNkLENBQUM7WUFDSCxDQUFDO2lCQUFNLENBQUM7Z0JBQ04sTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDL0IsSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUM3QixPQUFPLElBQUksQ0FBQztnQkFDZCxDQUFDO1lBQ0gsQ0FBQztRQUNILENBQUM7UUFFRCxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFFRCxpQkFBaUIsQ0FBQyxHQUFXO1FBQzNCLElBQUksQ0FBQyxZQUFZLEdBQUcsRUFBRSxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxjQUFjLEdBQUcsRUFBRSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO1FBQzNCLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUNULFlBQVk7WUFDWixPQUFPO1FBQ1QsQ0FBQztRQUNELElBQUksR0FBRyxLQUFLLEdBQUcsRUFBRSxDQUFDO1lBQ2hCLFlBQVk7WUFDWixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztZQUMxQixPQUFPO1FBQ1QsQ0FBQztRQUVELEtBQUssSUFBSSxFQUFFLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQzlCLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDO1FBQ3RDLENBQUM7UUFFRCxLQUFLLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztZQUN2RCxJQUFJLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztnQkFDMUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUM7WUFDbEMsQ0FBQztRQUNILENBQUM7SUFDSCxDQUFDO0lBRUQsZ0JBQWdCO0lBQ2hCLEtBQUssQ0FBQyxLQUFLLENBQ1QsV0FBbUIsRUFDbkIsSUFBUyxFQUNULFdBQXFCO1FBRXJCLElBQUksV0FBVyxFQUFFLENBQUM7WUFDaEIsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ25CLENBQUM7UUFDRCxNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3ZFLElBQUksV0FBVyxFQUFFLENBQUM7WUFDaEIsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ25CLENBQUM7UUFDRCxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssZUFBZSxFQUFFLENBQUM7WUFDcEMsdUNBQXVDO1lBQ3ZDLE1BQU0sQ0FBQyxJQUFJLENBQ1Qsb0VBQW9FLENBQ3JFLENBQUM7WUFDRixJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztZQUMzQixPQUFPLElBQUksQ0FBQztRQUNkLENBQUM7UUFDRCxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssV0FBVyxFQUFFLENBQUM7WUFDaEMsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ25CLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDaEMsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ3hCLENBQUM7WUFFRCxJQUFJLFdBQVcsS0FBSyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDMUMsT0FBTyxDQUFDLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO2dCQUMvQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM3QixDQUFDO1FBQ0gsQ0FBQzthQUFNLENBQUM7WUFDTixJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ3pCLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDeEIscUNBQXFDO1lBQ3ZDLENBQUM7aUJBQU0sQ0FBQztnQkFDTixJQUFJLENBQUMsUUFBUSxHQUFHO29CQUNkLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRTtpQkFDM0QsQ0FBQztZQUNKLENBQUM7UUFDSCxDQUFDO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQsS0FBSyxDQUFDLHVCQUF1QixDQUMzQixRQUFnQixFQUNoQixXQUFtQixFQUNuQixJQUFvQjtRQUVwQixNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzNFLElBQUksUUFBUSxDQUFDLE1BQU0sS0FBSyxXQUFXLEVBQUUsQ0FBQztZQUNwQyxJQUFJLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDdEIsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDakMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDcEQsQ0FBQztpQkFBTSxDQUFDO2dCQUNOLE1BQU0sQ0FBQyxLQUFLLENBQUMsV0FBVyxXQUFXLFNBQVMsQ0FBQyxDQUFDO1lBQ2hELENBQUM7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNmLENBQUM7UUFFRCxJQUFJLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQztRQUNyQixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDVixNQUFNLENBQUMsSUFBSSxDQUNULFdBQVcsV0FBVyxpREFBaUQsUUFBUSxpQkFBaUIsQ0FDakcsQ0FBQztZQUNGLElBQUksR0FBRyxFQUFFLENBQUM7UUFDWixDQUFDO1FBRUQsV0FBSSxDQUFDLFFBQVEsQ0FBQyxJQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDcEMsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQsS0FBSyxDQUFDLE9BQU8sQ0FDWCxRQUFnQixFQUNoQixZQUFxQixFQUNyQixHQUFxQjtRQUVyQixNQUFNLE1BQU0sR0FBRyxHQUFHLEtBQUssU0FBUyxDQUFDO1FBQ2pDLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdkMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ1gsS0FBSyxHQUFHO2dCQUNOLElBQUksRUFBRSxRQUFRO2dCQUNkLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixPQUFPLEVBQUUsTUFBTTtnQkFDZixTQUFTLEVBQUUsSUFBSTthQUNoQixDQUFDO1lBQ0YsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsR0FBRyxLQUFLLENBQUM7UUFDckMsQ0FBQztRQUVELElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2xCLFlBQVk7WUFDWixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ1osTUFBTSxDQUFDLEtBQUssQ0FDVixRQUFRLFFBQVEsd0ZBQXdGLENBQ3pHLENBQUM7Z0JBQ0YsT0FBTyxFQUFFLENBQUM7WUFDWixDQUFDO1lBRUQsSUFBSSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3BCLElBQUksS0FBSyxDQUFDLFNBQVMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO29CQUNyQyxPQUFPLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzlCLENBQUM7WUFDSCxDQUFDO2lCQUFNLENBQUM7Z0JBQ04sTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO2dCQUNoRSxJQUFJLElBQUksRUFBRSxDQUFDO29CQUNULE9BQU8sSUFBSSxDQUFDO2dCQUNkLENBQUM7Z0JBRUQsTUFBTSxDQUFDLEtBQUssQ0FDVixRQUFRLFFBQVEsMERBQTBELENBQzNFLENBQUM7Z0JBQ0YsT0FBTyxFQUFFLENBQUM7WUFDWixDQUFDO1FBQ0gsQ0FBQzthQUFNLENBQUM7WUFDTixhQUFhO1lBQ2IsSUFBSSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3BCLElBQUksS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO29CQUNoQyxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUM7Z0JBQ3BCLENBQUM7WUFDSCxDQUFDO2lCQUFNLENBQUM7Z0JBQ04sSUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ2YsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDO2dCQUNwQixDQUFDO2dCQUNELE1BQU0sQ0FBQyxLQUFLLENBQ1YsUUFBUSxRQUFRLDBEQUEwRCxDQUMzRSxDQUFDO2dCQUNGLE9BQU8sRUFBRSxDQUFDO1lBQ1osQ0FBQztRQUNILENBQUM7UUFFRCxNQUFNLFdBQVcsR0FBRyxTQUFHLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBQztRQUNwRCxNQUFNLElBQUksR0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLENBQUM7UUFDcEUsb0JBQW9CO1FBQ3BCLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDakQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFrQixDQUFDO1FBRTNDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNWLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxXQUFXLEVBQUUsQ0FBQztnQkFDaEMsTUFBTSxDQUFDLEtBQUssQ0FDViw2QkFBNkIsUUFBUSxLQUFLLElBQUksQ0FBQyxXQUFXLHVCQUF1QixDQUNsRixDQUFDO1lBQ0osQ0FBQztZQUNELE9BQU8sRUFBRSxDQUFDO1FBQ1osQ0FBQztRQUVELElBQUksS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ3BCLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNsQixJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDO29CQUNyQixLQUFLLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztnQkFDdkIsQ0FBQztnQkFDRCxLQUFLLENBQUMsU0FBVSxDQUFDLEdBQUksQ0FBQyxHQUFHLElBQUksQ0FBQztZQUNoQyxDQUFDO2lCQUFNLENBQUM7Z0JBQ04sS0FBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7WUFDcEIsQ0FBQztRQUNILENBQUM7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCxLQUFLLENBQUMsWUFBWSxDQUNoQixRQUFnQixFQUNoQixZQUFxQjtRQUVyQixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNYLEtBQUssR0FBRztnQkFDTixJQUFJLEVBQUUsUUFBUTtnQkFDZCxTQUFTLEVBQUUsS0FBSztnQkFDaEIsT0FBTyxFQUFFLElBQUk7Z0JBQ2IsU0FBUyxFQUFFLElBQUk7YUFDaEIsQ0FBQztZQUNGLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEdBQUcsS0FBSyxDQUFDO1FBQ3JDLENBQUM7UUFFRCxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ25CLE1BQU0sQ0FBQyxLQUFLLENBQ1YsUUFBUSxRQUFRLHlGQUF5RixDQUMxRyxDQUFDO1lBQ0YsT0FBTyxFQUFFLENBQUM7UUFDWixDQUFDO1FBRUQsSUFBSSxZQUFZLEtBQUssS0FBSyxJQUFJLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUM5QyxPQUFPLEtBQUssQ0FBQyxTQUFTLENBQUM7UUFDekIsQ0FBQztRQUVELE1BQU0sV0FBVyxHQUFHLFNBQUcsQ0FBQyxXQUFXLENBQUMsZUFBZSxDQUFDO1FBQ3BELE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ3pELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBaUIsQ0FBQztRQUUxQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDVixJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssV0FBVyxFQUFFLENBQUM7Z0JBQ2hDLE1BQU0sQ0FBQyxLQUFLLENBQ1YsNkJBQTZCLFFBQVEsS0FBSyxJQUFJLENBQUMsV0FBVyx1QkFBdUIsQ0FDbEYsQ0FBQztZQUNKLENBQUM7WUFDRCxPQUFPLEVBQUUsQ0FBQztRQUNaLENBQUM7UUFFRCxJQUFJLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNwQixLQUFLLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztRQUN6QixDQUFDO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQsYUFBYSxDQUFDLFVBQWtCLEVBQUUsS0FBYTtRQUM3QyxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzFDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNSLE9BQU87Z0JBQ0wsUUFBUSxFQUFFO29CQUNSO3dCQUNFLFNBQVMsRUFBRSxTQUFHLENBQUMsV0FBVyxDQUFDLG9CQUFvQjt3QkFDL0MsU0FBUyxFQUFFLE9BQU87d0JBQ2xCLE1BQU0sRUFBRSxDQUFDLFVBQVUsQ0FBQztxQkFDckI7aUJBQ0Y7YUFDRixDQUFDO1FBQ0osQ0FBQztRQUNELE9BQU8sRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ25CLENBQUM7SUFFRCxZQUFZLENBQUMsU0FBb0IsRUFBRSxTQUFpQjtRQUNsRCxNQUFNLEtBQUssR0FBRyxJQUFBLHlCQUFZLEVBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ2pELElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQ3hCLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQztRQUNuQixDQUFDO1FBQ0QsT0FBTyxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsY0FBYyxFQUFFLENBQUMsRUFBRSxDQUFDO0lBQzNFLENBQUM7SUFFRDs7O09BR0c7SUFDSyxVQUFVLENBQUMsSUFBUztRQUMxQixJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUMsQ0FBQyxXQUFXO1FBQ3pCLElBQUksSUFBSSxFQUFFLENBQUM7WUFDVCxPQUFPLENBQUMsSUFBSSxDQUFDLDRCQUE0QixFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2pELElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2pDLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxTQUFHLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ2pELElBQUksR0FBRyxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUN0QixHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsaUJBQWlCO1lBQzlCLENBQUM7aUJBQU0sQ0FBQztnQkFDTixHQUFHLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3ZCLENBQUM7UUFDSCxDQUFDO2FBQU0sQ0FBQztZQUNOLE9BQU8sQ0FBQyxJQUFJLENBQUMsdURBQXVELENBQUMsQ0FBQztZQUN0RSxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDaEMsQ0FBQztRQUNELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUNyQyxDQUFDO0lBRU8sV0FBVyxDQUFDLEdBQVksRUFBRSxHQUFXLEVBQUUsSUFBWTtRQUN6RCxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDVCxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxHQUFHLG1CQUFtQixJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZELENBQUM7SUFDSCxDQUFDO0NBQ0Y7QUF4cEJELGdCQXdwQkMifQ==