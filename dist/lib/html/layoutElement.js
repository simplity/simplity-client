"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LayoutElement = void 0;
const pageElement_1 = require("./pageElement");
const app_1 = require("../controller/app");
const logger_1 = require("../logger-stub/logger");
const htmlUtil_1 = require("./htmlUtil");
const menuGroupElement_1 = require("./menuGroupElement");
const PAGE_TITLE = 'page-title';
/**
 * Only child of AppElement. Defines the over-all layout
 */
class LayoutElement {
    /**
     * undefined before the first page rendered.
     */
    //private currentPageView?: PageElement;
    constructor(layout, params) {
        this.layout = layout;
        /**
         * html elements for any context-value being rendered in the layout
         */
        this.contextEles = {};
        //private currentModule = '';
        //private lc: LayoutController;
        /**
         * module names mapped to their indexes in the modules[] array
         */
        this.moduleMap = {};
        this.menuGroups = {};
        this.logger = logger_1.loggerStub.getLogger();
        this.ac = app_1.app.getCurrentAc();
        this.root = htmlUtil_1.htmlUtil.newHtmlElement('layout');
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
            const ele = htmlUtil_1.htmlUtil.getOptionalElement(this.root, nam);
            if (ele) {
                this.contextEles[nam] = ele;
            }
        }
        this.pageEle = htmlUtil_1.htmlUtil.getChildElement(this.root, 'page');
        this.renderModule(params);
    }
    /**
     *
     */
    renderModule(params) {
        const mn = params.module || this.layout.modules[0];
        const module = this.getInitialModule(mn);
        const menu = this.getInitialMenu(module, params.menuItem);
        if (menu.pageName) {
            this.renderPage(menu.pageName, params.params);
        }
        else {
            throw new Error(this.reportError(`Menu ${menu.name} has no associated page. Initial page can not be rendered`));
        }
    }
    renderPage(pageName, params) {
        const page = this.ac.getPage(pageName);
        const pageView = new pageElement_1.PageElement(page, params || {});
        //    this.currentPageView = pageView;
        if (this.menuBarEle) {
            if (page.hideModules) {
                this.menuBarEle.setAttribute('data-hidden', '');
            }
            else {
                this.menuBarEle.removeAttribute('data-hidden');
            }
        }
        htmlUtil_1.htmlUtil.removeChildren(this.pageEle);
        this.pageEle.appendChild(pageView.root);
    }
    getInitialModule(startWith) {
        let module;
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
        throw new Error(this.reportError(`Either no modules are set in this layout, or the logged-in user has no access to any module`));
    }
    getInitialMenu(module, menuItem) {
        if (menuItem) {
            const item = this.ac.getMenuIfAccessible(menuItem);
            if (item) {
                return item;
            }
            this.logger.error(`menuItem ${menuItem} is invalid, or is not accessible. navigating to the next possible menu item instead`);
        }
        for (const nam of module.menuItems) {
            const item = this.ac.getMenuIfAccessible(nam);
            if (item) {
                return item;
            }
        }
        throw new Error(this.reportError(`Either no menu items are set in this module, or the logged-in user has no access to any menu items`));
    }
    renderPageTitle(title) {
        const ele = this.contextEles[PAGE_TITLE];
        if (ele) {
            ele.textContent = title;
        }
        else {
            this.logger.warn('Current layout is not designed to render page title. Page title not rendered');
        }
    }
    renderContextValues(values) {
        for (const [key, value] of Object.entries(values)) {
            const ele = this.contextEles[key];
            if (ele) {
                ele.textContent = value;
            }
        }
    }
    renderMenuBar() {
        const menubar = htmlUtil_1.htmlUtil.getOptionalElement(this.root, 'menu-bar');
        if (!menubar) {
            console.log(this.root);
            this.logger.info(`Layout ${this.layout.name} has no child element with data-id="menu-bar". Menu not rendered`);
            return;
        }
        for (const moduleName of this.layout.modules) {
            const module = this.ac.getModule(moduleName);
            const mg = new menuGroupElement_1.MenuGroupElement(module);
            this.menuGroups[moduleName] = mg;
            const label = htmlUtil_1.htmlUtil.getChildElement(mg.root, 'label');
            if (module.icon) {
                htmlUtil_1.htmlUtil.appendIcon(label, module.icon);
            }
            htmlUtil_1.htmlUtil.appendText(label, module.label);
            menubar.appendChild(mg.root);
        }
        return menubar;
    }
    reportError(msg) {
        this.logger.error(msg);
        return msg;
    }
}
exports.LayoutElement = LayoutElement;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGF5b3V0RWxlbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvaHRtbC9sYXlvdXRFbGVtZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQVdBLCtDQUE0QztBQUM1QywyQ0FBd0M7QUFDeEMsa0RBQW1EO0FBQ25ELHlDQUFzQztBQUN0Qyx5REFBc0Q7QUFFdEQsTUFBTSxVQUFVLEdBQUcsWUFBWSxDQUFDO0FBQ2hDOztHQUVHO0FBQ0gsTUFBYSxhQUFhO0lBc0J4Qjs7T0FFRztJQUNILHdDQUF3QztJQUV4QyxZQUNrQixNQUFjLEVBQzlCLE1BQXdCO1FBRFIsV0FBTSxHQUFOLE1BQU0sQ0FBUTtRQW5CaEM7O1dBRUc7UUFDYyxnQkFBVyxHQUEyQixFQUFFLENBQUM7UUFFMUQsNkJBQTZCO1FBQzdCLCtCQUErQjtRQUMvQjs7V0FFRztRQUNjLGNBQVMsR0FBOEIsRUFBRSxDQUFDO1FBQzFDLGVBQVUsR0FBZ0MsRUFBRSxDQUFDO1FBVzVELElBQUksQ0FBQyxNQUFNLEdBQUcsbUJBQVUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNyQyxJQUFJLENBQUMsRUFBRSxHQUFHLFNBQUcsQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUU3QixJQUFJLENBQUMsSUFBSSxHQUFHLG1CQUFRLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRTlDOztXQUVHO1FBRUgsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFDO1FBQ3RDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDdEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDL0IsQ0FBQztRQUVELElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFD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