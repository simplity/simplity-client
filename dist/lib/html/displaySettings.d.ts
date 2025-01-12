/**
 * this is the utility that provides a meaningful "display-setting-name" to be used by view elements to change the way the element is rendered at run time o
 *  this approach provides flexibility for a css-specialist to style the htmls without needing to do any programming.
 * And of course, it provides the programmers freedom from the class-name nightmares
 *
 * The core idea is to provide attribute-value approach to changing the display for programming that can be implemented by the UX-specialist using css-classes
 * we think this approach is better than attribute-based class selectors in the .css file
 */
/**
 * what styles (class-names) to be added and the ones to be removed when a specific value is set to this attribute
 * Note that the attribute-name would be unique across all element types/tags
 * For example we have ele-clickable and row-clickable as two separate names
 * Setting
 */
export type DisplaySetting = {
    [value: string]: {
        toAdd?: string[];
        toRemove?: string[];
    };
};
declare const definedSettings: {
    /**
     * render column header for a sortable/sorted column
     */
    columnSorted: {
        /** sorted ascending */
        asc: {};
        /** sorted descending */
        desc: {};
        /** not sorted, but sortable */
        '': {};
    };
    /**
     * column-content text or sub-element
     */
    columnTextAlign: {
        left: {};
        right: {};
        centre: {};
        /** default */ '': {};
    };
    /**
     * number of columns consumed by an element.
     * Note that this can not be reset..
     */
    colSpan: {
        '1': {
            toAdd: string[];
        };
    };
    /**
     * page-container. Should be set only for the data-panel of the page
     */
    isPageDataPanel: {
        true: {
            toAdd: string[];
        };
    };
    /**
     * A container within the main container.
     */
    isContainer: {
        true: {
            toAdd: string[];
        };
    };
    /**
     * A table has rows that have on-click action/s
     */
    tableIsClickable: {
        true: {
            toAdd: string[];
        };
    };
    /**
     * A table has a facility to select/unselect rows
     */
    tableIsSelectable: {
        true: {
            toAdd: string[];
        };
    };
    /**
     * A menu item is hidden?
     */
    menuIsHidden: {
        true: {
            toAdd: never[];
        };
        false: {
            toAdd: never[];
        };
    };
    /**
     * An input field has invalid value
     */
    fieldIsInError: {
        true: {
            toAdd: never[];
        };
        false: {
            toAdd: never[];
        };
    };
};
export type DisplaySettingsName = keyof typeof definedSettings;
export declare const displaySettings: {
    set: typeof set;
};
/**
 * set the display state for an element.
 * If the setting is a boolean, use true/false.
 * Else use one of the pre-defined value for that setting. Use empty string to remove the setting
 * (that is ,the attribute is not relevant)
 *
 * @param name
 * @param value boolean if the name is defined as a boolean-setting,
 * or one of the pre-defined value (including empty string) for the specified display-name
 */
declare function set(ele: HTMLElement, name: DisplaySettingsName, value: boolean | string): void;
export {};
