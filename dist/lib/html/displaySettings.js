"use strict";
/**
 * this is the utility that provides a meaningful "display-setting-name" to be used by view elements to change the way the element is rendered at run time o
 *  this approach provides flexibility for a css-specialist to style the htmls without needing to do any programming.
 * And of course, it provides the programmers freedom from the class-name nightmares
 *
 * The core idea is to provide attribute-value approach to changing the display for programming that can be implemented by the UX-specialist using css-classes
 * we think this approach is better than attribute-based class selectors in the .css file
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.displaySettings = void 0;
const logger_1 = require("../logger-stub/logger");
const logger = logger_1.loggerStub.getLogger();
/**
 * Trick to get LayoutName as a type alias based on the keys
 */
function createSettings(items) {
    return items;
}
const definedSettings = createSettings({
    /**
     * render column header for a sortable/sorted column
     */
    columnSorted: {
        /** sorted ascending */
        asc: {},
        /** sorted descending */
        desc: {},
        /** not sorted, but sortable */
        '': {},
    },
    /**
     * column-content text or sub-element
     */
    columnTextAlign: {
        left: {},
        right: {},
        centre: {},
        /** default */ '': {},
    },
    /**
     * number of columns consumed by an element.
     * Note that this can not be reset..
     */
    colSpan: {
        '1': { toAdd: ['col-span-1'] },
    },
    /**
     * page-container. Should be set only for the data-panel of the page
     */
    isPageDataPanel: {
        true: {
            toAdd: ['grid', 'grid-cols-12', 'gap-4', 'w-full'],
        },
    },
    /**
     * A container within the main container.
     */
    isContainer: {
        true: {
            toAdd: ['grid', 'grid-cols-subgrid'],
        },
    },
    /**
     * A table has rows that have on-click action/s
     */
    tableIsClickable: {
        true: {
            toAdd: ['grid', 'grid-cols-subgrid'],
        },
    },
    /**
     * A table has a facility to select/unselect rows
     */
    tableIsSelectable: {
        true: {
            toAdd: ['grid', 'grid-cols-subgrid'],
        },
    },
    /**
     * A menu item is hidden?
     */
    menuIsHidden: {
        true: {
            toAdd: [],
        },
        false: {
            toAdd: [],
        },
    },
    /**
     * An input field has invalid value
     */
    fieldIsInError: {
        true: {
            toAdd: [],
        },
        false: {
            toAdd: [],
        },
    },
});
exports.displaySettings = { set };
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
function set(ele, name, value) {
    const entry = definedSettings[name];
    if (!entry) {
        logger.error(`'${name}' is not a valid display-settings-name. Element display-setting '${value}' ignored for element-tag '${ele.tagName}'`);
        return;
    }
    const setting = entry['' + value];
    if (!setting) {
        logger.error(`'${value}' is not a valid value for setting ${name}. Element display-setting '${value}' ignored for element-tag '${ele.tagName}'`);
        return;
    }
    let list = setting.toAdd;
    if (list) {
        ele.classList.add(...list);
    }
    list = setting.toRemove;
    if (list) {
        ele.classList.remove(...list);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlzcGxheVNldHRpbmdzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9odG1sL2Rpc3BsYXlTZXR0aW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7R0FPRzs7O0FBRUgsa0RBQW1EO0FBRW5ELE1BQU0sTUFBTSxHQUFHLG1CQUFVLENBQUMsU0FBUyxFQUFFLENBQUM7QUFZdEM7O0dBRUc7QUFDSCxTQUFTLGNBQWMsQ0FBMkMsS0FBUTtJQUN4RSxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFFRCxNQUFNLGVBQWUsR0FBRyxjQUFjLENBQUM7SUFDckM7O09BRUc7SUFDSCxZQUFZLEVBQUU7UUFDWix1QkFBdUI7UUFDdkIsR0FBRyxFQUFFLEVBQUU7UUFDUCx3QkFBd0I7UUFDeEIsSUFBSSxFQUFFLEVBQUU7UUFDUiwrQkFBK0I7UUFDL0IsRUFBRSxFQUFFLEVBQUU7S0FDUDtJQUVEOztPQUVHO0lBQ0gsZUFBZSxFQUFFO1FBQ2YsSUFBSSxFQUFFLEVBQUU7UUFDUixLQUFLLEVBQUUsRUFBRTtRQUNULE1BQU0sRUFBRSxFQUFFO1FBQ1YsY0FBYyxDQUFDLEVBQUUsRUFBRSxFQUFFO0tBQ3RCO0lBRUQ7OztPQUdHO0lBQ0gsT0FBTyxFQUFFO1FBQ1AsR0FBRyxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsWUFBWSxDQUFDLEVBQUU7S0FDL0I7SUFFRDs7T0FFRztJQUVILGVBQWUsRUFBRTtRQUNmLElBQUksRUFBRTtZQUNKLEtBQUssRUFBRSxDQUFDLE1BQU0sRUFBRSxjQUFjLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQztTQUNuRDtLQUNGO0lBQ0Q7O09BRUc7SUFDSCxXQUFXLEVBQUU7UUFDWCxJQUFJLEVBQUU7WUFDSixLQUFLLEVBQUUsQ0FBQyxNQUFNLEVBQUUsbUJBQW1CLENBQUM7U0FDckM7S0FDRjtJQUVEOztPQUVHO0lBQ0gsZ0JBQWdCLEVBQUU7UUFDaEIsSUFBSSxFQUFFO1lBQ0osS0FBSyxFQUFFLENBQUMsTUFBTSxFQUFFLG1CQUFtQixDQUFDO1NBQ3JDO0tBQ0Y7SUFFRDs7T0FFRztJQUNILGlCQUFpQixFQUFFO1FBQ2pCLElBQUksRUFBRTtZQUNKLEtBQUssRUFBRSxDQUFDLE1BQU0sRUFBRSxtQkFBbUIsQ0FBQztTQUNyQztLQUNGO0lBRUQ7O09BRUc7SUFDSCxZQUFZLEVBQUU7UUFDWixJQUFJLEVBQUU7WUFDSixLQUFLLEVBQUUsRUFBRTtTQUNWO1FBQ0QsS0FBSyxFQUFFO1lBQ0wsS0FBSyxFQUFFLEVBQUU7U0FDVjtLQUNGO0lBRUQ7O09BRUc7SUFDSCxjQUFjLEVBQUU7UUFDZCxJQUFJLEVBQUU7WUFDSixLQUFLLEVBQUUsRUFBRTtTQUNWO1FBQ0QsS0FBSyxFQUFFO1lBQ0wsS0FBSyxFQUFFLEVBQUU7U0FDVjtLQUNGO0NBQ0YsQ0FBQyxDQUFDO0FBSVUsUUFBQSxlQUFlLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztBQUV2Qzs7Ozs7Ozs7O0dBU0c7QUFDSCxTQUFTLEdBQUcsQ0FDVixHQUFnQixFQUNoQixJQUF5QixFQUN6QixLQUF1QjtJQUV2QixNQUFNLEtBQUssR0FBRyxlQUFlLENBQUMsSUFBSSxDQUFtQixDQUFDO0lBQ3RELElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNYLE1BQU0sQ0FBQyxLQUFLLENBQ1YsSUFBSSxJQUFJLG9FQUFvRSxLQUFLLDhCQUE4QixHQUFHLENBQUMsT0FBTyxHQUFHLENBQzlILENBQUM7UUFDRixPQUFPO0lBQ1QsQ0FBQztJQUVELE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxFQUFFLEdBQUcsS0FBSyxDQUFDLENBQUM7SUFDbEMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2IsTUFBTSxDQUFDLEtBQUssQ0FDVixJQUFJLEtBQUssc0NBQXNDLElBQUksOEJBQThCLEtBQUssOEJBQThCLEdBQUcsQ0FBQyxPQUFPLEdBQUcsQ0FDbkksQ0FBQztRQUNGLE9BQU87SUFDVCxDQUFDO0lBRUQsSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQztJQUN6QixJQUFJLElBQUksRUFBRSxDQUFDO1FBQ1QsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztJQUM3QixDQUFDO0lBQ0QsSUFBSSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUM7SUFDeEIsSUFBSSxJQUFJLEVBQUUsQ0FBQztRQUNULEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7SUFDaEMsQ0FBQztBQUNILENBQUMifQ==