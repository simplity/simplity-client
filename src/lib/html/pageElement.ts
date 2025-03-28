import {
  Alert,
  ButtonPanel,
  FormController,
  Page,
  PageController,
  PageView,
  Values,
} from 'simplity-types';
import { htmlUtil } from './htmlUtil';
import { PanelElement } from './panelElement';
import { app } from '../controller/app';
import { elementFactory } from './elementFactory';
//import { loggerStub } from '../logger-stub/logger';
//const logger = loggerStub.getLogger();
const NBR_COLS_IN_GRID = 12;

export class PageElement implements PageView {
  private readonly titleEle?: HTMLElement;
  // private readonly buttonsEle: HTMLElement;
  private readonly pc: PageController;
  private readonly fc: FormController;
  public readonly root: HTMLElement;

  constructor(
    public readonly page: Page,
    public readonly inputs: Values
  ) {
    this.root = htmlUtil.newHtmlElement('page');

    this.titleEle = htmlUtil.getOptionalElement(this.root, 'title');
    const dataContainer = htmlUtil.getChildElement(this.root, 'data');
    const buttonsEle = htmlUtil.getChildElement(this.root, 'buttons');
    /**
     * are we to put buttons above data-panel?
     */
    if (page.renderButtonsBeforeData) {
      buttonsEle.remove();
      const ele = dataContainer.parentElement!;
      ele.insertBefore(buttonsEle, ele.firstChild);
    }

    this.pc = app.newPc(this);
    this.fc = this.pc.fc;

    const dataPanel = new PanelElement(
      this.pc.fc,
      this.page.dataPanel,
      NBR_COLS_IN_GRID
    );
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
      const buttonPanel: ButtonPanel = {
        name: page.name + '_Buttons',
        compType: 'buttonPanel',
        leftButtons: page.leftButtons,
        middleButtons: page.middleButtons,
        rightButtons: page.rightButtons,
      };
      const ele = elementFactory.newElement(
        this.fc,
        buttonPanel,
        NBR_COLS_IN_GRID
      );
      buttonsEle.appendChild(ele.root);
    }

    this.pc.pageRendered();
    //we want to ensure that any event that would have triggered should complete before we proceed with pageLoaded
    this.pc.pageLoaded();
  }

  pageLoaded(): void {
    this.pc.pageLoaded();
  }
  showButtons(toShow: boolean): void {
    toShow;
  }

  alert(alerts: Alert[]): void {
    console.info(alerts);
    window.alert(
      'alert from the Page (We are working on a better alert. Please bear with us):\n' +
        JSON.stringify(alerts)
    );
  }
}
