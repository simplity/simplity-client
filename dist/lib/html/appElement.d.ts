import { Alert, AppController, AppView, NavigationAction, PanelView, RuntimeApp, StringMap, Values } from 'simplity-types';
export declare class AppElement implements AppView {
    readonly root: HTMLElement;
    private currentPopup?;
    private layoutEle?;
    private readonly logger;
    readonly ac: AppController;
    /**
     *
     * @param runtimeApp
     * @param appEle container element to which the app-view is to be appended to
     */
    constructor(runtimeApp: RuntimeApp, appEle: HTMLElement);
    private renderLayout;
    navigate(action: NavigationAction): void;
    renderContextValues(values: StringMap<string>): void;
    renderPageTitle(title: string): void;
    renderPage(pageName: string, pageParams?: Values): void;
    showAlert(alert: Alert): void;
    getUserChoice(text: string, choices: string[]): Promise<number>;
    renderAsPopup(panel: PanelView): void;
    closePopup(): void;
    doNavigate(url: string): void;
}
