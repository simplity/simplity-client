import { Alert, Page, PageView, Values } from 'simplity-types';
export declare class PageElement implements PageView {
    readonly page: Page;
    readonly inputs: Values;
    private readonly titleEle?;
    private readonly pc;
    private readonly fc;
    readonly root: HTMLElement;
    constructor(page: Page, inputs: Values);
    pageLoaded(): void;
    showButtons(toShow: boolean): void;
    alert(alerts: Alert[]): void;
}
