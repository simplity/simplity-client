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
        /**
         * keep the modal container ready;
         */
        this.modalContainerEle = htmlUtil_1.htmlUtil.newHtmlElement('panel-modal');
        this.modalPageParent = htmlUtil_1.htmlUtil.getChildElement(this.modalContainerEle, 'page');
        document.body.appendChild(this.modalContainerEle);
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
        console.info(`going to render page '${pageName}' with asModal=${options.asModal}`);
        const page = this.ac.getPage(pageName);
        if (options.erasePagesOnTheStack) {
            this.purgeStack();
        }
        /**
         * if the old page was modal, we just close that
         */
        if (this.modalPageView) {
            this.closeModalPage();
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
                    //old page is gone
                    lastEntry.ele.root.remove();
                }
            }
        }
        const pageView = new pageElement_1.PageElement(page, options.params || {});
        if (options.asModal && this.modalContainerEle) {
            this.modalPageView = pageView;
            this.modalPageParent.appendChild(pageView.root);
            htmlUtil_1.htmlUtil.setViewState(this.modalContainerEle, 'hidden', false);
        }
        else {
            this.pageStack.push({
                ele: pageView,
                scrollTop: 0,
            });
            this.pageEle.appendChild(pageView.root);
        }
        if (this.menuBarEle) {
            const toHide = this.modalPageView === undefined && !!page.hideModules;
            htmlUtil_1.htmlUtil.setViewState(this.menuBarEle, 'hidden', toHide);
        }
    }
    /**
     * to be called if the page was opened after retaining the earlier page
     */
    closeCurrentPage() {
        if (this.modalPageView) {
            this.closeModalPage();
            return;
        }
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
        if (this.menuBarEle) {
            const toHide = !!entry.ele.page.hideModules;
            htmlUtil_1.htmlUtil.setViewState(this.menuBarEle, 'hidden', toHide);
        }
        window.scrollTo({ top: entry.scrollTop, behavior: 'instant' });
    }
    closeModalPage() {
        htmlUtil_1.htmlUtil.setViewState(this.modalContainerEle, 'hidden', true);
        this.modalPageView.root.remove();
        this.modalPageView = undefined;
    }
    purgeStack() {
        if (this.modalPageView) {
            this.modalPageView.root.remove;
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGF5b3V0RWxlbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvaHRtbC9sYXlvdXRFbGVtZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQVNBLCtDQUE0QztBQUM1QywyQ0FBd0M7QUFDeEMsa0RBQW1EO0FBQ25ELHlDQUFzRDtBQUN0RCxtREFBZ0Q7QUFHaEQsTUFBTSxVQUFVLEdBQUcsWUFBWSxDQUFDO0FBQ2hDOztHQUVHO0FBQ0gsTUFBYSxhQUFhO0lBaUN4QixZQUNrQixNQUFjLEVBQzlCLE9BQTBCO1FBRFYsV0FBTSxHQUFOLE1BQU0sQ0FBUTtRQW5CaEM7O1dBRUc7UUFDYyxnQkFBVyxHQUEyQixFQUFFLENBQUM7UUFFMUQsNkJBQTZCO1FBQzdCLCtCQUErQjtRQUMvQjs7V0FFRztRQUNjLGNBQVMsR0FBOEIsRUFBRSxDQUFDO1FBQzFDLGVBQVUsR0FBNkIsRUFBRSxDQUFDO1FBRTNEOztXQUVHO1FBQ2MsY0FBUyxHQUFrQixFQUFFLENBQUM7UUFNN0MsSUFBSSxDQUFDLE1BQU0sR0FBRyxtQkFBVSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ3JDLElBQUksQ0FBQyxFQUFFLEdBQUcsU0FBRyxDQUFDLFlBQVksRUFBRSxDQUFDO1FBRTdCLElBQUksQ0FBQyxJQUFJLEdBQUcsbUJBQVEsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDOUM7O1dBRUc7UUFDSCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsbUJBQVEsQ0FBQyxjQUFjLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDaEUsSUFBSSxDQUFDLGVBQWUsR0FBRyxtQkFBUSxDQUFDLGVBQWUsQ0FDN0MsSUFBSSxDQUFDLGlCQUFpQixFQUN0QixNQUFNLENBQ1AsQ0FBQztRQUNGLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBRWxEOztXQUVHO1FBRUgsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFDO1FBQ3RDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDdEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDL0IsQ0FBQztRQUVELElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBRXZDOztXQUVHO1FBQ0gsS0FBSyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDckIsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFDckMsS0FBSyxHQUFHLENBQUMsVUFBVSxFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBQzVELENBQUM7UUFFRCxLQUFLLE1BQU0sR0FBRyxJQUFJLEtBQUssRUFBRSxDQUFDO1lBQ3hCLE1BQU0sR0FBRyxHQUFHLG1CQUFRLENBQUMsa0JBQWtCLENBQ3JDLElBQUksQ0FBQyxJQUFJLEVBQ1QsR0FBcUIsQ0FDUCxDQUFDO1lBQ2pCLElBQUksR0FBRyxFQUFFLENBQUM7Z0JBQ1IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUM7WUFDOUIsQ0FBQztRQUNILENBQUM7UUFFRCxJQUFJLENBQUMsT0FBTyxHQUFHLG1CQUFRLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDM0QsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM3QixDQUFDO0lBRUQ7O09BRUc7SUFDSCxZQUFZLENBQUMsT0FBMEI7UUFDckMsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwRCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDekMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzNELElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2xCLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUMxQyxDQUFDO2FBQU0sQ0FBQztZQUNOLE1BQU0sSUFBSSxLQUFLLENBQ2IsSUFBSSxDQUFDLFdBQVcsQ0FDZCxRQUFRLElBQUksQ0FBQyxJQUFJLDJEQUEyRCxDQUM3RSxDQUNGLENBQUM7UUFDSixDQUFDO0lBQ0gsQ0FBQztJQUVELFVBQVUsQ0FBQyxRQUFnQixFQUFFLE9BQTBCO1FBQ3JELE9BQU8sQ0FBQyxJQUFJLENBQ1YseUJBQXlCLFFBQVEsa0JBQWtCLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FDckUsQ0FBQztRQUNGLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRXZDLElBQUksT0FBTyxDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFDakMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ3BCLENBQUM7UUFFRDs7V0FFRztRQUNILElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUN4QixDQUFDO2FBQU0sQ0FBQztZQUNOLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDdkMsSUFBSSxTQUFTLEVBQUUsQ0FBQztnQkFDZCxJQUFJLE9BQU8sQ0FBQyxPQUFPLElBQUksT0FBTyxDQUFDLGlCQUFpQixFQUFFLENBQUM7b0JBQ2pELGdEQUFnRDtvQkFDaEQsU0FBUyxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQztvQkFDekQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQywwQkFBMEI7b0JBRTFELElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7d0JBQ3JCLHNCQUFzQjt3QkFDdEIsbUJBQVEsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUM1RCxDQUFDO2dCQUNILENBQUM7cUJBQU0sQ0FBQztvQkFDTixrQkFBa0I7b0JBQ2xCLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUM5QixDQUFDO1lBQ0gsQ0FBQztRQUNILENBQUM7UUFFRCxNQUFNLFFBQVEsR0FBRyxJQUFJLHlCQUFXLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDLENBQUM7UUFDN0QsSUFBSSxPQUFPLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQzlDLElBQUksQ0FBQyxhQUFhLEdBQUcsUUFBUSxDQUFDO1lBQzlCLElBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNoRCxtQkFBUSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2pFLENBQUM7YUFBTSxDQUFDO1lBQ04sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7Z0JBQ2xCLEdBQUcsRUFBRSxRQUFRO2dCQUNiLFNBQVMsRUFBRSxDQUFDO2FBQ2IsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzFDLENBQUM7UUFFRCxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNwQixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsYUFBYSxLQUFLLFNBQVMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQztZQUN0RSxtQkFBUSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUMzRCxDQUFDO0lBQ0gsQ0FBQztJQUVEOztPQUVHO0lBQ0ksZ0JBQWdCO1FBQ3JCLElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUN0QixPQUFPO1FBQ1QsQ0FBQztRQUVELElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDakMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ1gsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQ2YsK0RBQStELENBQ2hFLENBQUM7WUFDRixPQUFPO1FBQ1QsQ0FBQztRQUNELElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDaEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQ2YsU0FBUyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLCtGQUErRixDQUM1SCxDQUFDO1lBQ0YsT0FBTztRQUNULENBQUM7UUFDRCxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUV4QixvQkFBb0I7UUFDcEIsS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDbEQsbUJBQVEsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3ZELElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ3BCLE1BQU0sTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7WUFDNUMsbUJBQVEsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDM0QsQ0FBQztRQUNELE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxHQUFHLEVBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQztJQUNqRSxDQUFDO0lBRU8sY0FBYztRQUNwQixtQkFBUSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsaUJBQWtCLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQy9ELElBQUksQ0FBQyxhQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2xDLElBQUksQ0FBQyxhQUFhLEdBQUcsU0FBUyxDQUFDO0lBQ2pDLENBQUM7SUFFTyxVQUFVO1FBQ2hCLElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUNqQyxDQUFDO1FBQ0QsS0FBSyxNQUFNLEtBQUssSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDbkMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDMUIsQ0FBQztJQUNILENBQUM7SUFFTyxnQkFBZ0IsQ0FBQyxTQUFrQjtRQUN6QyxJQUFJLE1BQTBCLENBQUM7UUFDL0IsSUFBSSxTQUFTLEVBQUUsQ0FBQztZQUNkLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLHFCQUFxQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3BELENBQUM7UUFFRCxJQUFJLE1BQU0sRUFBRSxDQUFDO1lBQ1gsT0FBTyxNQUFNLENBQUM7UUFDaEIsQ0FBQztRQUVELEtBQUssTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNwQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUIsSUFBSSxNQUFNLEVBQUUsQ0FBQztnQkFDWCxPQUFPLE1BQU0sQ0FBQztZQUNoQixDQUFDO1FBQ0gsQ0FBQztRQUVELGdEQUFnRDtRQUNoRCxNQUFNLElBQUksS0FBSyxDQUNiLElBQUksQ0FBQyxXQUFXLENBQ2QsNkZBQTZGLENBQzlGLENBQ0YsQ0FBQztJQUNKLENBQUM7SUFFTyxjQUFjLENBQUMsTUFBYyxFQUFFLFFBQWlCO1FBQ3RELElBQUksUUFBUSxFQUFFLENBQUM7WUFDYixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ25ELElBQUksSUFBSSxFQUFFLENBQUM7Z0JBQ1QsT0FBTyxJQUFJLENBQUM7WUFDZCxDQUFDO1lBQ0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQ2YsWUFBWSxRQUFRLHNGQUFzRixDQUMzRyxDQUFDO1FBQ0osQ0FBQztRQUVELEtBQUssTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ25DLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDOUMsSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDVCxPQUFPLElBQUksQ0FBQztZQUNkLENBQUM7UUFDSCxDQUFDO1FBRUQsTUFBTSxJQUFJLEtBQUssQ0FDYixJQUFJLENBQUMsV0FBVyxDQUNkLG9HQUFvRyxDQUNyRyxDQUNGLENBQUM7SUFDSixDQUFDO0lBRUQsZUFBZSxDQUFDLEtBQWE7UUFDM0IsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN6QyxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQ1IsR0FBRyxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7UUFDMUIsQ0FBQzthQUFNLENBQUM7WUFDTixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FDZCw4RUFBOEUsQ0FDL0UsQ0FBQztRQUNKLENBQUM7SUFDSCxDQUFDO0lBRUQsbUJBQW1CLENBQUMsTUFBeUI7UUFDM0MsS0FBSyxNQUFNLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztZQUNsRCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2xDLElBQUksR0FBRyxFQUFFLENBQUM7Z0JBQ1IsR0FBRyxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7WUFDMUIsQ0FBQztRQUNILENBQUM7SUFDSCxDQUFDO0lBRU8sYUFBYTtRQUNuQixNQUFNLE9BQU8sR0FBRyxtQkFBUSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDbkUsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdkIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQ2QsVUFBVSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksa0VBQWtFLENBQzdGLENBQUM7WUFDRixPQUFPO1FBQ1QsQ0FBQztRQUVELEtBQUssTUFBTSxVQUFVLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUM3QyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUM3QyxNQUFNLEVBQUUsR0FBRyxJQUFJLDZCQUFhLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM5QyxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUNqQyxNQUFNLEtBQUssR0FBRyxtQkFBUSxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ3pELElBQUksTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNoQixtQkFBUSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzFDLENBQUM7WUFDRCxtQkFBUSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3pDLE9BQU8sQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9CLENBQUM7UUFFRCxPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDO0lBRU8sV0FBVyxDQUFDLEdBQVc7UUFDN0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdkIsT0FBTyxHQUFHLENBQUM7SUFDYixDQUFDO0NBQ0Y7QUEvU0Qsc0NBK1NDIn0=