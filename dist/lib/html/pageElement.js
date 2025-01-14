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
        this.root = htmlUtil_1.htmlUtil.newHtmlElement('page');
        this.titleEle = htmlUtil_1.htmlUtil.getOptionalElement(this.root, 'title');
        const dataContainer = htmlUtil_1.htmlUtil.getChildElement(this.root, 'data');
        this.buttonsEle = htmlUtil_1.htmlUtil.getChildElement(this.root, 'buttons');
        /**
         * are we to put buttons above data-panel?
         */
        if (page.renderButtonsBeforeData) {
            this.buttonsEle.remove();
            const ele = dataContainer.parentElement;
            ele.insertBefore(this.buttonsEle, ele.firstChild);
        }
        this.pc = app_1.app.newPc(this);
        this.fc = this.pc.fc;
        const dataPanel = new panelElement_1.PanelElement(this.pc.fc, this.page.dataPanel, NBR_COLS_IN_GRID);
        /**
         * dataPanel is the main container that defines the width units
         */
        dataContainer.appendChild(dataPanel.root);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFnZUVsZW1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2h0bWwvcGFnZUVsZW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBUUEseUNBQXNDO0FBQ3RDLGlEQUE4QztBQUM5QywyQ0FBd0M7QUFDeEMsK0NBQTRDO0FBQzVDLHFEQUFxRDtBQUNyRCx3Q0FBd0M7QUFDeEMsTUFBTSxnQkFBZ0IsR0FBRyxFQUFFLENBQUM7QUFFNUIsTUFBYSxXQUFXO0lBT3RCLFlBQ2tCLElBQVUsRUFDVixNQUFjO1FBRGQsU0FBSSxHQUFKLElBQUksQ0FBTTtRQUNWLFdBQU0sR0FBTixNQUFNLENBQVE7UUFFOUIsSUFBSSxDQUFDLElBQUksR0FBRyxtQkFBUSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUU1QyxJQUFJLENBQUMsUUFBUSxHQUFHLG1CQUFRLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNoRSxNQUFNLGFBQWEsR0FBRyxtQkFBUSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ2xFLElBQUksQ0FBQyxVQUFVLEdBQUcsbUJBQVEsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztRQUNqRTs7V0FFRztRQUNILElBQUksSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7WUFDakMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUN6QixNQUFNLEdBQUcsR0FBRyxhQUFhLENBQUMsYUFBYyxDQUFDO1lBQ3pDLEdBQUcsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDcEQsQ0FBQztRQUVELElBQUksQ0FBQyxFQUFFLEdBQUcsU0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJ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