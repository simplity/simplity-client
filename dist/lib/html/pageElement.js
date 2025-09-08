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
    constructor(page, inputs) {
        this.page = page;
        this.inputs = inputs;
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
}
exports.PageElement = PageElement;
//# sourceMappingURL=pageElement.js.map