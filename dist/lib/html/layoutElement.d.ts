import { Layout, NavigationOptions, StringMap } from 'simplity-types';
/**
 * Only child of AppElement. Defines the over-all layout
 */
export declare class LayoutElement {
    readonly layout: Layout;
    readonly root: HTMLElement;
    private readonly ac;
    private readonly logger;
    private readonly pageEle;
    private readonly menuBarEle?;
    /**
     * html elements for any context-value being rendered in the layout
     */
    private readonly contextEles;
    /**
     * module names mapped to their indexes in the modules[] array
     */
    private readonly moduleMap;
    private readonly menuGroups;
    /**
     * keeps track of active pages. Current one is on the top.
     */
    private readonly pageStack;
    constructor(layout: Layout, options: NavigationOptions);
    /**
     *
     */
    renderModule(options: NavigationOptions): void;
    renderPage(pageName: string, options: NavigationOptions): void;
    /**
     * to be called if the page was opened after retaining the earlier page
     */
    closeCurrentPage(): void;
    private purgeStack;
    private getInitialModule;
    private getInitialMenu;
    renderPageTitle(title: string): void;
    renderContextValues(values: StringMap<string>): void;
    private renderMenuBar;
    private reportError;
}
