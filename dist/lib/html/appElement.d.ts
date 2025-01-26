import { Alert, AppController, ClientRuntime, AppView, NavigationOptions, PanelView, StringMap } from 'simplity-types';
export declare class AppElement implements AppView {
    readonly root: HTMLElement;
    private currentPopup?;
    private layoutEle?;
    private readonly logger;
    readonly ac: AppController;
    private readonly pageStack;
    /**
     *
     * @param runtime
     * @param appEle container element to which the app-view is to be appended to
     */
    constructor(runtime: ClientRuntime, appEle: HTMLElement);
    private renderLayout;
    navigate(options: NavigationOptions): void;
    renderContextValues(values: StringMap<string>): void;
    renderPageTitle(title: string): void;
    showAlert(alert: Alert): void;
    getUserChoice(text: string, choices: string[]): Promise<number>;
    renderAsPopup(panel: PanelView): void;
    closePopup(): void;
    doNavigate(url: string): void;
}
