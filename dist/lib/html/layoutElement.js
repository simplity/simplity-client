"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LayoutElement = void 0;
const pageElement_1 = require("./pageElement");
const app_1 = require("../controller/app");
const logger_1 = require("../logger-stub/logger");
const htmlUtil_1 = require("./htmlUtil");
const moduleElement_1 = require("./moduleElement");
const PAGE_TITLE = 'page-title';
/**
 * Only child of AppElement. Defines the over-all layout
 */
class LayoutElement {
    constructor(layout, options) {
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
        /**
         * keeps track of active pages. Current one is on the top.
         */
        this.pageStack = [];
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
        this.renderModule(options);
    }
    /**
     *
     */
    renderModule(options) {
        const mn = options.module || this.layout.modules[0];
        const module = this.getInitialModule(mn);
        const menu = this.getInitialMenu(module, options.menuItem);
        if (menu.pageName) {
            this.renderPage(menu.pageName, options);
        }
        else {
            throw new Error(this.reportError(`Menu ${menu.name} has no associated page. Initial page can not be rendered`));
        }
    }
    renderPage(pageName, options) {
        const page = this.ac.getPage(pageName);
        if (options.purgePageStack) {
            this.purgeStack();
        }
        else {
            const lastEntry = this.pageStack.pop();
            if (lastEntry) {
                if (options.asModal || options.retainCurrentPage) {
                    //save the scroll position for us to get back to
                    lastEntry.scrollTop = document.documentElement.scrollTop;
                    this.pageStack.push(lastEntry); //retain the current page.
                    if (!options.asModal) {
                        //hide it if not modal
                        htmlUtil_1.htmlUtil.setViewState(lastEntry.ele.root, 'hidden', true);
                    }
                }
                else {
                    lastEntry.ele.root.remove();
                }
            }
        }
        const pageView = new pageElement_1.PageElement(page, options.params || {});
        this.pageStack.push({
            ele: pageView,
            scrollTop: 0,
        });
        if (this.menuBarEle) {
            if (page.hideModules) {
                this.menuBarEle.setAttribute('data-hidden', '');
            }
            else {
                this.menuBarEle.removeAttribute('data-hidden');
            }
        }
        this.pageEle.appendChild(pageView.root);
    }
    /**
     * to be called if the page was opened after retaining the earlier page
     */
    closeCurrentPage() {
        let entry = this.pageStack.pop();
        if (!entry) {
            this.logger.error(`layout.closeCurrentPage() invoked but there is no page open!!`);
            return;
        }
        if (this.pageStack.length === 0) {
            this.logger.error(`page '${entry.ele.page.name}' cannot be closed because there is no active page to render. Error in page navigation design`);
            return;
        }
        entry.ele.root.remove();
        //show the last page
        entry = this.pageStack[this.pageStack.length - 1];
        htmlUtil_1.htmlUtil.setViewState(entry.ele.root, 'hidden', false);
        window.scrollTo({ top: entry.scrollTop, behavior: 'instant' });
    }
    purgeStack() {
        for (const entry of this.pageStack) {
            entry.ele.root.remove();
        }
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
            const mg = new moduleElement_1.ModuleElement(this.ac, module);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGF5b3V0RWxlbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvaHRtbC9sYXlvdXRFbGVtZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQVNBLCtDQUE0QztBQUM1QywyQ0FBd0M7QUFDeEMsa0RBQW1EO0FBQ25ELHlDQUFzQztBQUN0QyxtREFBZ0Q7QUFHaEQsTUFBTSxVQUFVLEdBQUcsWUFBWSxDQUFDO0FBQ2hDOztHQUVHO0FBQ0gsTUFBYSxhQUFhO0lBMkJ4QixZQUNrQixNQUFjLEVBQzlCLE9BQTBCO1FBRFYsV0FBTSxHQUFOLE1BQU0sQ0FBUTtRQW5CaEM7O1dBRUc7UUFDYyxnQkFBVyxHQUEyQixFQUFFLENBQUM7UUFFMUQsNkJBQTZCO1FBQzdCLCtCQUErQjtRQUMvQjs7V0FFRztRQUNjLGNBQVMsR0FBOEIsRUFBRSxDQUFDO1FBQzFDLGVBQVUsR0FBNkIsRUFBRSxDQUFDO1FBRTNEOztXQUVHO1FBQ2MsY0FBUyxHQUFrQixFQUFFLENBQUM7UUFNN0MsSUFBSSxDQUFDLE1BQU0sR0FBRyxtQkFBVSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ3JDLElBQUksQ0FBQyxFQUFFLEdBQUcsU0FBRyxDQUFDLFlBQVksRUFBRSxDQUFDO1FBRTdCLElBQUksQ0FBQyxJQUFJLEdBQUcsbUJBQVEsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFOUM7O1dBRUc7UUFFSCxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUM7UUFDdEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUN0QyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMvQixDQUFDO1FBRUQsSUFBSSxDQUFDLFVBQVUs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