"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppElement = void 0;
const layoutElement_1 = require("./layoutElement");
const app_1 = require("../controller/app");
const logger_1 = require("../logger-stub/logger");
const htmlUtil_1 = require("./htmlUtil");
const PAGE_TITLE = 'page-title';
class AppElement {
    /**
     *
     * @param runtime
     * @param appEle container element to which the app-view is to be appended to
     */
    constructor(runtime, appEle) {
        this.pageStack = [];
        this.logger = logger_1.loggerStub.getLogger();
        this.root = appEle;
        //create the all important and all powerful controller of controllers!!!
        this.ac = app_1.app.newAc(runtime, this);
        //render the default layout
        this.renderLayout(runtime.startingLayout, {
            module: runtime.startingModule,
        });
    }
    renderLayout(layoutName, params) {
        if (this.layoutEle) {
            if (this.layoutEle.layout.name === layoutName) {
                return;
            }
            this.layoutEle.root.remove();
        }
        const layout = this.ac.getLayout(layoutName);
        const lv = new layoutElement_1.LayoutElement(layout, params);
        this.layoutEle = lv;
        this.root.appendChild(lv.root);
    }
    navigate(options) {
        if (options.closePage) {
            this.layoutEle.closeCurrentPage();
            return;
        }
        //navigate to a layout??
        if (options.layout &&
            this.layoutEle &&
            this.layoutEle.layout.name !== options.layout) {
            if (options.asModal || options.retainCurrentPage) {
                throw this.ac.newError(`When the current page is retained, new menu-item must be from the same-layout`);
            }
            if (this.pageStack.length) {
                throw this.ac.newError(`Navigation requested from layout '${this.layoutEle.layout.name}' to '${options.layout}'. 
            There are ${this.pageStack.length} pages on the stack. 
            If these can be removed, then you must set erasePagesOnTheStack.true`);
            }
            this.renderLayout(options.layout, options);
            return;
        }
        if (options.module) {
            this.layoutEle.renderModule(options);
            return;
        }
        if (!options.menuItem) {
            throw this.ac.newError(`Navigation action has no layout/module/menu specified. navigation aborted`);
        }
        const menu = this.ac.getMenu(options.menuItem);
        if (!menu.pageName) {
            this.logger.error(`Menu item ${options.menuItem} has no pageName. Can not navigate`);
            return;
        }
        this.layoutEle.renderPage(menu.pageName, options);
    }
    renderContextValues(values) {
        for (const [name, value] of Object.entries(values)) {
            const ele = htmlUtil_1.htmlUtil.getOptionalElement(this.root, name);
            if (ele) {
                ele.textContent = value.toString();
            }
            else {
                this.logger.info(`field ${name} with a value of "${value}" could not be rendered because an element with attribute data-id="${name} was not found in the html document`);
            }
        }
    }
    renderPageTitle(title) {
        const values = {};
        values[PAGE_TITLE] = title;
        this.renderContextValues(values);
    }
    showAlert(alert) {
        console.info(alert);
        window.alert('alert from app: \n' + JSON.stringify(alert));
    }
    getUserChoice(text, choices) {
        throw new Error(`Text: ${text} to be rendered asking for${choices.length} options. This functionality is not yet developed`);
    }
    renderAsPopup(panel) {
        if (this.currentPopup) {
            throw new Error(`Panel ${panel.name} to be rendered as popup. But panel ${this.currentPopup.name} is already shown as popup`);
        }
        this.currentPopup = panel;
        this.logger.warn(`Panel ${panel.name} to be rendered as popup. This functionality is not yet developed`);
    }
    closePopup() {
        if (this.currentPopup) {
            this.currentPopup = undefined;
        }
        else {
            this.logger.warn(`A closePopup() is request when there is no active popup`);
        }
    }
    doNavigate(url) {
        app_1.app.getCurrentAc().newWindow(url);
    }
}
exports.AppElement = AppElement;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwRWxlbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvaHRtbC9hcHBFbGVtZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1EQUFnRDtBQVdoRCwyQ0FBd0M7QUFDeEMsa0RBQW1EO0FBQ25ELHlDQUFzQztBQUd0QyxNQUFNLFVBQVUsR0FBRyxZQUFZLENBQUM7QUFFaEMsTUFBYSxVQUFVO0lBU3JCOzs7O09BSUc7SUFDSCxZQUFZLE9BQXNCLEVBQUUsTUFBbUI7UUFQdEMsY0FBUyxHQUFrQixFQUFFLENBQUM7UUFRN0MsSUFBSSxDQUFDLE1BQU0sR0FBRyxtQkFBVSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBRXJDLElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDO1FBRW5CLHdFQUF3RTtRQUN4RSxJQUFJLENBQUMsRUFBRSxHQUFHLFNBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRW5DLDJCQUEyQjtRQUMzQixJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUU7WUFDeEMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxjQUFjO1NBQy9CLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFTyxZQUFZLENBQUMsVUFBa0IsRUFBRSxNQUF5QjtRQUNoRSxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNuQixJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxVQUFVLEVBQUUsQ0FBQztnQkFDOUMsT0FBTztZQUNULENBQUM7WUFDRCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUMvQixDQUFDO1FBRUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDN0MsTUFBTSxFQUFFLEdBQUcsSUFBSSw2QkFBYSxDQUFD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