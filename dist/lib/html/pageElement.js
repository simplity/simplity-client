"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageElement = void 0;
const htmlUtil_1 = require("./htmlUtil");
const panelElement_1 = require("./panelElement");
const app_1 = require("../controller/app");
const leafElement_1 = require("./leafElement");
//import { loggerStub } from '../logger-stub/logger';
//const logger = loggerStub.getLogger();
const NBR_COLS_IN_GRID = 12;
class PageElement {
    constructor(page, params) {
        this.page = page;
        this.params = params;
        this.root = htmlUtil_1.htmlUtil.newHtmlElement('template-page');
        this.titleEle = htmlUtil_1.htmlUtil.getOptionalElement(this.root, 'title');
        this.panelEle = htmlUtil_1.htmlUtil.getChildElement(this.root, 'panel');
        this.buttonsEle = htmlUtil_1.htmlUtil.getChildElement(this.root, 'buttons');
        /**
         * are we to put buttons above data-panel?
         */
        if (page.renderButtonsBeforeData) {
            this.buttonsEle.remove();
            this.panelEle.parentElement?.insertBefore(this.buttonsEle, this.panelEle);
        }
        this.pc = app_1.app.newPc(this);
        this.fc = this.pc.fc;
        const container = htmlUtil_1.htmlUtil.newPageContainer();
        this.panelEle.appendChild(container);
        const panel = new panelElement_1.PanelElement(this.pc.fc, this.page.dataPanel, NBR_COLS_IN_GRID);
        container.appendChild(panel.root);
        if (this.titleEle) {
            let title = this.page.titlePrefix || '';
            if (this.page.titleField) {
                const val = this.fc.getFieldValue(this.page.titleField);
                if (val) {
                    title += val;
                }
            }
            this.titleEle.textContent = title + (this.page.titleSuffix || '');
        }
        /**
         * we are yet to design left-centre-right buttons. We merge them into one group
         */
        const buttons = [
            ...(page.leftButtons || []),
            ...(page.middleButtons || []),
            ...(page.rightButtons || []),
        ];
        if (buttons.length) {
            for (const button of buttons) {
                const ele = new leafElement_1.LeafElement(this.fc, button, NBR_COLS_IN_GRID);
                this.buttonsEle.appendChild(ele.root);
            }
        }
        this.pc.pageRendered();
        this.pc.pageLoaded();
    }
    showButtons(toShow) {
        toShow;
    }
    alert(alerts) {
        console.info(alerts);
        window.alert('alert from the Page (We are working on a better alert. Please bear with us):\n' +
            JSON.stringify(alerts));
    }
    disableUx() {
        window.alert('Disabling UX is yet to be implemented. Please refrain from editing anything');
    }
    enableUx() {
        window.alert('Ok. You may edit it now');
    }
}
exports.PageElement = PageElement;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFnZUVsZW1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2h0bWwvcGFnZUVsZW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBUUEseUNBQXNDO0FBQ3RDLGlEQUE4QztBQUM5QywyQ0FBd0M7QUFDeEMsK0NBQTRDO0FBQzVDLHFEQUFxRDtBQUNyRCx3Q0FBd0M7QUFDeEMsTUFBTSxnQkFBZ0IsR0FBRyxFQUFFLENBQUM7QUFFNUIsTUFBYSxXQUFXO0lBUXRCLFlBQ2tCLElBQVUsRUFDVixNQUFjO1FBRGQsU0FBSSxHQUFKLElBQUksQ0FBTTtRQUNWLFdBQU0sR0FBTixNQUFNLENBQVE7UUFFOUIsSUFBSSxDQUFDLElBQUksR0FBRyxtQkFBUSxDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUVyRCxJQUFJLENBQUMsUUFBUSxHQUFHLG1CQUFRLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNoRSxJQUFJLENBQUMsUUFBUSxHQUFHLG1CQUFRLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDN0QsSUFBSSxDQUFDLFVBQVUsR0FBRyxtQkFBUSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ2pFOztXQUVHO1FBQ0gsSUFBSSxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztZQUNqQyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxFQUFFLFlBQVksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM1RSxDQUFDO1FBRUQsSUFBSSxDQUFDLEVBQUUsR0FBRyxTQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzFC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