import {
  Alert,
  FormController,
  Page,
  PageController,
  PageView,
  Values,
} from 'simplity-types';
import { htmlUtil } from './htmlUtil';
import { PanelElement } from './panelElement';
import { app } from '../controller/app';
import { LeafElement } from './leafElement';
//import { loggerStub } from '../logger-stub/logger';
//const logger = loggerStub.getLogger();
export class PageElement implements PageView {
  private readonly titleEle?: HTMLElement;
  private readonly panelEle: HTMLElement;
  private readonly buttonsEle: HTMLElement;
  private readonly pc: PageController;
  private readonly fc: FormController;
  public readonly root: HTMLElement;

  constructor(
    public readonly page: Page,
    public readonly params: Values
  ) {
    this.root = htmlUtil.newHtmlElement('template-page');

    this.titleEle = htmlUtil.getOptionalElement(this.root, 'title');
    this.panelEle = htmlUtil.getChildElement(this.root, 'panel');
    this.buttonsEle = htmlUtil.getChildElement(this.root, 'buttons');
    /**
     * are we to put buttons above data-panel?
     */
    if (page.renderButtonsBeforeData) {
      this.buttonsEle.remove();
      this.panelEle.parentElement?.insertBefore(this.buttonsEle, this.panelEle);
    }

    this.pc = app.newPc(this);
    this.fc = this.pc.fc;

    const panel = new PanelElement(this.pc.fc, this.page.dataPanel);

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
        const ele = new LeafElement(this.fc, button);
        this.buttonsEle.appendChild(ele.root);
      }
    }

    this.pc.pageRendered();
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

  disableUx(): void {
    window.alert(
      'Disabling UX is yet to be implemented. Please refrain from editing anything'
    );
  }

  enableUx(): void {
    window.alert('Ok. You may edit it now');
  }
}
