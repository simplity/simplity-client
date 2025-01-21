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
    navigate(action) {
        const p = {
            menuItem: action.menuItem,
            module: action.module,
            params: action.params,
        };
        if (action.layout) {
            this.renderLayout(action.layout, p);
            return;
        }
        if (action.module) {
            this.layoutEle.renderModule(p);
            return;
        }
        if (!action.menuItem) {
            throw this.ac.newError(`Navigation action ${action.name} has no layout/module/menu specified. navigation aborted`);
        }
        const menu = this.ac.getMenu(action.menuItem);
        if (!menu.pageName) {
            throw this.ac.newError(`Navigation action ${action.name} specifies ${action.menuItem} but that menu has not specified pageName. Navigation aborted`);
        }
        console.info(`requesting layout to go to page ${menu.pageName} with params:`, action.params);
        this.layoutEle.renderPage(menu.pageName, action.params);
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
    renderPage(pageName, pageParams) {
        this.layoutEle.renderPage(pageName, pageParams);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwRWxlbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvaHRtbC9hcHBFbGVtZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1EQUFnRDtBQWFoRCwyQ0FBd0M7QUFDeEMsa0RBQW1EO0FBQ25ELHlDQUFzQztBQUV0QyxNQUFNLFVBQVUsR0FBRyxZQUFZLENBQUM7QUFFaEMsTUFBYSxVQUFVO0lBT3JCOzs7O09BSUc7SUFDSCxZQUFZLE9BQXNCLEVBQUUsTUFBbUI7UUFDckQsSUFBSSxDQUFDLE1BQU0sR0FBRyxtQkFBVSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBRXJDLElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDO1FBRW5CLHdFQUF3RTtRQUN4RSxJQUFJLENBQUMsRUFBRSxHQUFHLFNBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRW5DLDJCQUEyQjtRQUMzQixJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUU7WUFDeEMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxjQUFjO1NBQy9CLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFTyxZQUFZLENBQUMsVUFBa0IsRUFBRSxNQUF3QjtRQUMvRCxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNuQixJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxVQUFVLEVBQUUsQ0FBQztnQkFDOUMsT0FBTztZQUNULENBQUM7WUFDRCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUMvQixDQUFDO1FBRUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDN0MsTUFBTSxFQUFFLEdBQUcsSUFBSSw2QkFBYSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztR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