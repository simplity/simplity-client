import { Alert, Page, PageView, Values } from 'simplity-types';
export declare class PageElement implements PageView {
    readonly page: Page;
    readonly params: Values;
    private readonly titleEle?;
    private readonly panelEle;
    private readonly buttonsEle;
    private readonly pc;
    private readonly fc;
    readonly root: HTMLElement;
    constructor(page: Page, params: Values);
    showButtons(toShow: boolean): void;
    alert(alerts: Alert[]): void;
    disableUx(): void;
    enableUx(): void;
}
