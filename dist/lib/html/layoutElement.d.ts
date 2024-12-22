import { Layout, LayoutView, NavigationParams, StringMap, Values } from 'simplity-types';
/**
 * Only child of AppElement. Defines the over-all layout
 */
export declare class LayoutElement implements LayoutView {
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
     * undefined before the first page rendered.
     */
    constructor(layout: Layout, params: NavigationParams);
    /**
     *
     */
    renderModule(params: NavigationParams): void;
    renderPage(pageName: string, params?: Values): void;
    private getInitialModule;
    private getInitialMenu;
    renderPageTitle(title: string): void;
    renderContextValues(values: StringMap<string>): void;
    private renderMenuBar;
    private reportError;
}
