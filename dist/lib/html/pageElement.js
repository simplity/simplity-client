"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageElement = void 0;
const htmlUtil_1 = require("./htmlUtil");
const panelElement_1 = require("./panelElement");
const app_1 = require("../controller/app");
const elementFactory_1 = require("./elementFactory");
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
        const buttonsEle = htmlUtil_1.htmlUtil.getChildElement(this.root, 'buttons');
        /**
         * are we to put buttons above data-panel?
         */
        if (page.renderButtonsBeforeData) {
            buttonsEle.remove();
            const ele = dataContainer.parentElement;
            ele.insertBefore(buttonsEle, ele.firstChild);
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
        if (page.leftButtons || page.middleButtons || page.rightButtons) {
            const buttonPanel = {
                name: page.name + '_Buttons',
                compType: 'buttonPanel',
                leftButtons: page.leftButtons,
                middleButtons: page.middleButtons,
                rightButtons: page.rightButtons,
            };
            const ele = elementFactory_1.elementFactory.newElement(this.fc, buttonPanel, NBR_COLS_IN_GRID);
            buttonsEle.appendChild(ele.root);
        }
        this.pc.pageRendered();
        //we want to ensure that any event that would have triggered should complete before we proceed with pageLoaded
        this.pc.pageLoaded();
    }
    pageLoaded() {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFnZUVsZW1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2h0bWwvcGFnZUVsZW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBU0EseUNBQXNDO0FBQ3RDLGlEQUE4QztBQUM5QywyQ0FBd0M7QUFDeEMscURBQWtEO0FBQ2xELHFEQUFxRDtBQUNyRCx3Q0FBd0M7QUFDeEMsTUFBTSxnQkFBZ0IsR0FBRyxFQUFFLENBQUM7QUFFNUIsTUFBYSxXQUFXO0lBT3RCLFlBQ2tCLElBQVUsRUFDVixNQUFjO1FBRGQsU0FBSSxHQUFKLElBQUksQ0FBTTtRQUNWLFdBQU0sR0FBTixNQUFNLENBQVE7UUFFOUIsSUFBSSxDQUFDLElBQUksR0FBRyxtQkFBUSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUU1QyxJQUFJLENBQUMsUUFBUSxHQUFHLG1CQUFRLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNoRSxNQUFNLGFBQWEsR0FBRyxtQkFBUSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ2xFLE1BQU0sVUFBVSxHQUFHLG1CQUFRLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDbEU7O1dBRUc7UUFDSCxJQUFJLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1lBQ2pDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNwQixNQUFNLEdBQUcsR0FBRyxhQUFhLENBQUMsYUFBYyxDQUFDO1lBQ3pDLEdBQUcsQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMvQyxDQUFDO1FBRUQsSUFBSSxDQUFDLEVBQUUsR0FBRyxTQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzFCLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7UUFFckIsTUFBTSxTQUFTLEdBQUcsSUFBSSwyQkFBWSxDQUNoQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFDVixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFDbkIsZ0JBQWdCLENBQ2pCLENBQUM7UUFDRjs7V0FFRztRQUNILGFBQWEsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRTFDLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2xCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxJQUFJLEVBQUUsQ0FBQztZQUN4QyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3pCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ3hELElBQUksR0FBRyxFQUFFLENBQUM7b0JBQ1IsS0FBSyxJQUFJLEdBQUcsQ0FBQztnQkFDZixDQUFDO1lBQ0gsQ0FBQztZQUNELElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxHQUFHLEtBQUssR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ3BFLENBQUM7UUFFRCxJQUFJLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLGFBQWEsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDaEUsTUFBTSxXQUFXLEdBQWdCO2dCQUMvQixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksR0FBRyxVQUFVO2dCQUM1QixRQUFRLEVBQUUsYUFBYTtnQkFDdkIsV0FBVyxFQUFFLElBQUksQ0FBQyxXQUFXO2dCQUM3QixhQUFhLEVBQUUsSUFBSSxDQUFDLGFBQWE7Z0JBQ2pDLFlBQVksRUFBRSxJQUFJLENBQUMsWUFBWTthQUNoQyxDQUFDO1lBQ0YsTUFBTSxHQUFHLEdBQUcsK0JBQWMsQ0FBQyxVQUFVLENBQ25DLElBQUksQ0FBQyxFQUFFLEVBQ1AsV0FBVyxFQUNYLGdCQUFnQixDQUNqQixDQUFDO1lBQ0YsVUFBVSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbkMsQ0FBQztRQUVELElBQUksQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDdkIsOEdBQThHO1FBQzlHLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDdkIsQ0FBQztJQUVELFVBQVU7UUFDUixJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxDQUFDO0lBQ3ZCLENBQUM7SUFDRCxXQUFXLENBQUMsTUFBZTtRQUN6QixNQUFNLENBQUM7SUFDVCxDQUFDO0lBRUQsS0FBSyxDQUFDLE1BQWU7UUFDbkIsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNyQixNQUFNLENBQUMsS0FBSyxDQUNWLGdGQUFnRjtZQUM5RSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUN6QixDQUFDO0lBQ0osQ0FBQztJQUVELFNBQVM7UUFDUCxNQUFNLENBQUMsS0FBSyxDQUNWLDZFQUE2RSxDQUM5RSxDQUFDO0lBQ0osQ0FBQztJQUVELFFBQVE7UUFDTixNQUFNLENBQUMsS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7SUFDMUMsQ0FBQztDQUNGO0FBOUZELGtDQThGQyJ9