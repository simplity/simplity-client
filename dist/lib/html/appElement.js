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
        this.spinnerEle = htmlUtil_1.htmlUtil.newHtmlElement('disable-ux');
        if (this.spinnerEle) {
            document.body.appendChild(this.spinnerEle);
        }
        this.messageEle = htmlUtil_1.htmlUtil.newHtmlElement('message');
        if (this.messageEle) {
            this.messageTextEle = htmlUtil_1.htmlUtil.getOptionalElement(this.messageEle, 'message');
            document.body.appendChild(this.messageEle);
        }
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
    showAlerts(alerts) {
        console.info(alerts);
        let msg = '';
        for (const alert of alerts) {
            msg += alert.type + ': ' + alert.text + '\n';
        }
        if (!this.messageEle || !this.messageTextEle) {
            window.alert(msg);
            return;
        }
        const txt = this.messageTextEle.innerText;
        if (txt) {
            msg = txt + '\n' + msg;
        }
        this.messageTextEle.innerText = msg;
        htmlUtil_1.htmlUtil.setViewState(this.messageEle, 'hidden', false);
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
    disableUx() {
        if (this.spinnerEle) {
            htmlUtil_1.htmlUtil.setViewState(this.spinnerEle, 'hidden', false);
        }
        else {
            this.logger.error(`App has not provided an html-template named 'disable-ux'. UX is not disabled`);
        }
    }
    enableUx() {
        if (this.spinnerEle) {
            htmlUtil_1.htmlUtil.setViewState(this.spinnerEle, 'hidden', true);
        }
    }
}
exports.AppElement = AppElement;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwRWxlbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvaHRtbC9hcHBFbGVtZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1EQUFnRDtBQVdoRCwyQ0FBd0M7QUFDeEMsa0RBQW1EO0FBQ25ELHlDQUFzRDtBQUd0RCxNQUFNLFVBQVUsR0FBRyxZQUFZLENBQUM7QUFFaEMsTUFBYSxVQUFVO0lBV3JCOzs7O09BSUc7SUFDSCxZQUFZLE9BQXNCLEVBQUUsTUFBbUI7UUFUdEMsY0FBUyxHQUFrQixFQUFFLENBQUM7UUFVN0MsSUFBSSxDQUFDLE1BQU0sR0FBRyxtQkFBVSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ3JDLElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDO1FBRW5CLHdFQUF3RTtRQUN4RSxJQUFJLENBQUMsRUFBRSxHQUFHLFNBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRW5DLDJCQUEyQjtRQUMzQixJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUU7WUFDeEMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxjQUFjO1NBQy9CLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxVQUFVLEdBQUcsbUJBQVEsQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDeEQsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDcEIsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzdDLENBQUM7UUFDRCxJQUFJLENBQUMsVUFBVSxHQUFHLG1CQUFRLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3JELElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ3BCLElBQUksQ0FBQyxjQUFjLEdBQUcsbUJBQVEsQ0FBQyxrQkFBa0IsQ0FDL0MsSUFBSSxDQUFDLFVBQVUsRUFDZixTQUFTLENBQ1YsQ0FBQztZQUNGLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUM3QyxDQUFDO0lBQ0gsQ0FBQztJQUVPLFlBQVksQ0FBQyxVQUFrQixFQUFFLE1BQXlCO1FBQ2hFLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ25CLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLFVBQVUsRUFBRSxDQUFDO2dCQUM5QyxPQUFPO1lBQ1QsQ0FBQztZQUNELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQy9CLENBQUM7UUFFRCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUM3QyxNQUFNLEVBQUUsR0FBRyxJQUFJLDZCQUFhLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzdDLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO1FBQ3BCLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNqQyxDQUFDO0lBRUQsUUFBUSxDQUFDLE9BQTBCO1FBQ2pDLElBQUksT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxTQUFVLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztZQUNuQyxPQUFPO1FBQ1QsQ0FBQztRQUVELHdCQUF3QjtRQUN4QixJQUNFLE9BQU8sQ0FBQyxNQUFNO1lBQ2QsSUFBSSxDQUFDLFNBQVM7WUFDZCxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssT0FBTyxDQUFDLE1BQU0sRUFDN0MsQ0FBQztZQUNELElBQUksT0FBTyxDQUFDLE9BQU8sSUFBSSxPQUFPLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztnQkFDakQsTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FDcEIsK0VBQStFLENBQ2hGLENBQUM7WUFDSixDQUFDO1lBRUQsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUMxQixNQUFNLElBQUksQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUNwQixxQ0FBcUMsSUFBSSxDQUFDLFNBQVUsQ0FBQyxNQUFNLENBQUMsSUFBSSxTQUFTLE9BQU8sQ0FBQyxNQUFNO3dCQUN6RSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU07aUZBQ29DLENBQ3hFLENBQUM7WUFDSixDQUFDO1lBRUQsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzNDLE9BQU87UUFDVCxDQUFDO1FBRUQsSUFBSSxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDbkIsSUFBSSxDQUFDLFNBQVUsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDdEMsT0FBTztRQUNULENBQUM7UUFFRCxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3RCLE1BQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQ3BCLDJFQUEyRSxDQUM1RSxDQUFDO1FBQ0osQ0FBQztRQUVELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMvQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ25CLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUNmLGFBQWEsT0FBTyxDQUFDLFFBQVEsb0NBQW9DLENBQ2xFLENBQUM7WUFDRixPQUFPO1FBQ1QsQ0FBQztRQUVELElBQUksQ0FBQyxTQUFVLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDckQsQ0FBQztJQUVELG1CQUFtQixDQUFDLE1BQXlCO1FBQzNDLEtBQUssTUFBTSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7WUFDbkQsTUFBTSxHQUFHLEdBQUcsbUJBQVEsQ0FBQyxrQkFBa0IsQ0FDckMsSUFBSSxDQUFDLElBQUksRUFDVCxJQUFzQixDQUN2QixDQUFDO1lBQ0YsSUFBSSxHQUFHLEVBQUUsQ0FBQztnQkFDUixHQUFHLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNyQyxDQUFDO2lCQUFNLENBQUM7Z0JBQ04sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQ2QsU0FBUyxJQUFJLHFCQUFxQixLQUFLLHNFQUFzRSxJQUFJLHFDQUFxQyxDQUN2SixDQUFDO1lBQ0osQ0FBQztRQUNILENBQUM7SUFDSCxDQUFDO0lBRUQsZUFBZSxDQUFDLEtBQWE7UUFDM0IsTUFBTSxNQUFNLEdBQXNCLEVBQUUsQ0FBQztRQUNyQyxNQUFNLENBQUMsVUFBVSxDQUFDLEdBQUcsS0FBSyxDQUFDO1FBQzNCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBRUQsVUFBVSxDQUFDLE1BQWU7UUFDeEIsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNyQixJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUM7UUFDYixLQUFLLE1BQU0sS0FBSyxJQUFJLE1BQU0sRUFBRSxDQUFDO1lBQzNCLEdBQUcsSUFBSSxLQUFLLENBQUMsSUFBSSxHQUFHLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUMvQyxDQUFDO1FBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDN0MsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNsQixPQUFPO1FBQ1QsQ0FBQztRQUNELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDO1FBQzFDLElBQUksR0FBRyxFQUFFLENBQUM7WUFDUixHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLENBQUM7UUFDekIsQ0FBQztRQUNELElBQUksQ0FBQyxjQUFjLENBQUMsU0FBUyxHQUFHLEdBQUcsQ0FBQztRQUNwQyxtQkFBUSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUMxRCxDQUFDO0lBRUQsYUFBYSxDQUFDLElBQVksRUFBRSxPQUFpQjtRQUMzQyxNQUFNLElBQUksS0FBSyxDQUNiLFNBQVMsSUFBSSw2QkFBNkIsT0FBTyxDQUFDLE1BQU0sbURBQW1ELENBQzVHLENBQUM7SUFDSixDQUFDO0lBRUQsYUFBYSxDQUFDLEtBQWdCO1FBQzVCLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3RCLE1BQU0sSUFBSSxLQUFLLENBQ2IsU0FBUyxLQUFLLENBQUMsSUFBSSx1Q0FBdUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLDRCQUE0QixDQUM3RyxDQUFDO1FBQ0osQ0FBQztRQUNELElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO1FBQzFCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUNkLFNBQVMsS0FBSyxDQUFDLElBQUksbUVBQW1FLENBQ3ZGLENBQUM7SUFDSixDQUFDO0lBRUQsVUFBVTtRQUNSLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxZQUFZLEdBQUcsU0FBUyxDQUFDO1FBQ2hDLENBQUM7YUFBTSxDQUFDO1lBQ04sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQ2QseURBQXlELENBQzFELENBQUM7UUFDSixDQUFDO0lBQ0gsQ0FBQztJQUVELFVBQVUsQ0FBQyxHQUFXO1FBQ3BCLFNBQUcsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVELFNBQVM7UUFDUCxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNwQixtQkFBUSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMxRCxDQUFDO2FBQU0sQ0FBQztZQUNOLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUNmLDhFQUE4RSxDQUMvRSxDQUFDO1FBQ0osQ0FBQztJQUNILENBQUM7SUFFRCxRQUFRO1FBQ04sSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDcEIsbUJBQVEsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDekQsQ0FBQztJQUNILENBQUM7Q0FDRjtBQXBNRCxnQ0FvTUMifQ==