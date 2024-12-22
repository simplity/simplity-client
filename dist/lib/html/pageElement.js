"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageElement = void 0;
const htmlUtil_1 = require("./htmlUtil");
const panelElement_1 = require("./panelElement");
const app_1 = require("../controller/app");
const leafElement_1 = require("./leafElement");
//import { loggerStub } from '../logger-stub/logger';
//const logger = loggerStub.getLogger();
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
        const panel = new panelElement_1.PanelElement(this.pc.fc, this.page.dataPanel);
        this.panelEle.appendChild(panel.root);
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
                const ele = new leafElement_1.LeafElement(this.fc, button);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFnZUVsZW1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2h0bWwvcGFnZUVsZW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBUUEseUNBQXNDO0FBQ3RDLGlEQUE4QztBQUM5QywyQ0FBd0M7QUFDeEMsK0NBQTRDO0FBQzVDLHFEQUFxRDtBQUNyRCx3Q0FBd0M7QUFDeEMsTUFBYSxXQUFXO0lBUXRCLFlBQ2tCLElBQVUsRUFDVixNQUFjO1FBRGQsU0FBSSxHQUFKLElBQUksQ0FBTTtRQUNWLFdBQU0sR0FBTixNQUFNLENBQVE7UUFFOUIsSUFBSSxDQUFDLElBQUksR0FBRyxtQkFBUSxDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUVyRCxJQUFJLENBQUMsUUFBUSxHQUFHLG1CQUFRLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNoRSxJQUFJLENBQUMsUUFBUSxHQUFHLG1CQUFRLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDN0QsSUFBSSxDQUFDLFVBQVUsR0FBRyxtQkFBUSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ2pFOztXQUVHO1FBQ0gsSUFBSSxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztZQUNqQyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxFQUFFLFlBQVksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM1RSxDQUFDO1FBRUQsSUFBSSxDQUFDLEVBQUUsR0FBRyxTQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzFCLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7UUFFckIsTUFBTSxLQUFLLEdBQUcsSUFBSSwyQkFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFFaEUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRXRDLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2xCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxJQUFJLEVBQUUsQ0FBQztZQUN4QyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3pCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ3hELElBQUksR0FBRyxFQUFFLENBQUM7b0JBQ1IsS0FBSyxJQUFJLEdBQUcsQ0FBQztnQkFDZixDQUFDO1lBQ0gsQ0FBQztZQUNELElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxHQUFHLEtBQUssR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ3BFLENBQUM7UUFFRDs7V0FFRztRQUNILE1BQU0sT0FBTyxHQUFHO1lBQ2QsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLElBQUksRUFBRSxDQUFDO1lBQzNCLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxJQUFJLEVBQUUsQ0FBQztZQUM3QixHQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksSUFBSSxFQUFFLENBQUM7U0FDN0IsQ0FBQztRQUNGLElBQUksT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ25CLEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxFQUFFLENBQUM7Z0JBQzdCLE1BQU0sR0FBRyxHQUFHLElBQUkseUJBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUM3QyxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDeEMsQ0FBQztRQUNILENBQUM7UUFFRCxJQUFJLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDdkIsQ0FBQztJQUVELFdBQVcsQ0FBQyxNQUFlO1FBQ3pCLE1BQU0sQ0FBQztJQUNULENBQUM7SUFFRCxLQUFLLENBQUMsTUFBZTtRQUNuQixPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3JCLE1BQU0sQ0FBQyxLQUFLLENBQ1YsZ0ZBQWdGO1lBQzlFLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQ3pCLENBQUM7SUFDSixDQUFDO0lBRUQsU0FBUztRQUNQLE1BQU0sQ0FBQyxLQUFLLENBQ1YsNkVBQTZFLENBQzlFLENBQUM7SUFDSixDQUFDO0lBRUQsUUFBUTtRQUNOLE1BQU0sQ0FBQyxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztJQUMxQyxDQUFDO0NBQ0Y7QUFuRkQsa0NBbUZDIn0=