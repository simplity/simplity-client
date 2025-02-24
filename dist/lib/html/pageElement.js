import { htmlUtil } from './htmlUtil';
import { PanelElement } from './panelElement';
import { app } from '../controller/app';
import { elementFactory } from './elementFactory';
//import { loggerStub } from '../logger-stub/logger';
//const logger = loggerStub.getLogger();
const NBR_COLS_IN_GRID = 12;
export class PageElement {
    page;
    params;
    titleEle;
    // private readonly buttonsEle: HTMLElement;
    pc;
    fc;
    root;
    constructor(page, params) {
        this.page = page;
        this.params = params;
        this.root = htmlUtil.newHtmlElement('page');
        this.titleEle = htmlUtil.getOptionalElement(this.root, 'title');
        const dataContainer = htmlUtil.getChildElement(this.root, 'data');
        const buttonsEle = htmlUtil.getChildElement(this.root, 'buttons');
        /**
         * are we to put buttons above data-panel?
         */
        if (page.renderButtonsBeforeData) {
            buttonsEle.remove();
            const ele = dataContainer.parentElement;
            ele.insertBefore(buttonsEle, ele.firstChild);
        }
        this.pc = app.newPc(this);
        this.fc = this.pc.fc;
        const dataPanel = new PanelElement(this.pc.fc, this.page.dataPanel, NBR_COLS_IN_GRID);
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
            const ele = elementFactory.newElement(this.fc, buttonPanel, NBR_COLS_IN_GRID);
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
}
//# sourceMappingURL=pageElement.js.map