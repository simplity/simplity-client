import { Values } from '..';
/**
 * Layout is the top level view component.
 * Layout defines how the next level components are spread on the view canvass
 */
export type Layout = {
    name: string;
    /**
     * title to be shown on the browser/app
     */
    appTitle: string;
    /**
     * module names, in the order to be rendered.
     */
    modules: string[];
    /**
     * if the layout is to render some values like logged-in user etc..
     * Values for these names are expected to be in the client-context (appController.getContextValue(name));
     */
    contextNamesToRender?: string[];
};
/**
 * Module is a child of a layout.
 * it is used when the app has many pages that need to be grouped by modules.
 * A module consists of menu-items. As a view component, it is responsible for showing menu-items.
 */
export type Module = {
    /**
     * unique within a layout
     */
    name: string;
    /**
     * label
     */
    label: string;
    /**
     * iamge/icon name. for svg rendered as html, use "htmlName.html" convention
     */
    icon?: string;
    /**
     * params to be passed to the default page
     */
    params?: Values;
    /**
     * must include all menu items, including the hidden one's that are not rendered, but used as target for navigation action.
     */
    menuItems: string[];
};
/**
 * a menu-item is mapped to a page. It is possible that more than one menu-item may point to the same page
 */
export type MenuItem = {
    /**
     * unique across all modules.
     * such a naming conventions allows modules to be just a grouping. A menu may be part of more than one module
     */
    name: string;
    /**
     * hidden menu is not rendered in the menu, but is a valid target in a navigation action
     */
    isHidden?: boolean;
    /**
     * label to be rendered for the menu.
     */
    label?: string;
    /**
     * image for the menu. This is the path relative the root of image folder.
     * deployment environment takes care of folder etc..
     */
    icon?: string;
    /**
     * page to be opened for this menu. used only for sub-menu and not for module
     */
    pageName?: string;
    /**
     * optional parameters to be passed to the page
     */
    params?: Values;
    /**
     * som emenu items, like login should be allowed always
     */
    guestAccess?: boolean;
};
