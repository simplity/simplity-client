/**
 * this is the utility that provides a meaningful "display-setting-name" to be used by view elements to change the way the element is rendered at run time o
 *  this approach provides flexibility for a css-specialist to style the htmls without needing to do any programming.
 * And of course, it provides the programmers freedom from the class-name nightmares
 *
 * The core idea is to provide attribute-value approach to changing the display for programming that can be implemented by the UX-specialist using css-classes
 * we think this approach is better than attribute-based class selectors in the .css file
 */

import { loggerStub } from '../logger-stub/logger';

const logger = loggerStub.getLogger();

/**
 * what styles (class-names) to be added and the ones to be removed when a specific value is set to this attribute
 * Note that the attribute-name would be unique across all element types/tags
 * For example we have ele-clickable and row-clickable as two separate names
 * Setting
 */
export type DisplaySetting = {
  [value: string]: { toAdd?: string[]; toRemove?: string[] };
};

/**
 * Trick to get LayoutName as a type alias based on the keys
 */
function createSettings<T extends Record<string, DisplaySetting>>(items: T) {
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

export type DisplaySettingsName = keyof typeof definedSettings;

export const displaySettings = { set };

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
function set(
  ele: HTMLElement,
  name: DisplaySettingsName,
  value: boolean | string
) {
  const entry = definedSettings[name] as DisplaySetting;
  if (!entry) {
    logger.error(
      `'${name}' is not a valid display-settings-name. Element display-setting '${value}' ignored for element-tag '${ele.tagName}'`
    );
    return;
  }

  const setting = entry['' + value];
  if (!setting) {
    logger.error(
      `'${value}' is not a valid value for setting ${name}. Element display-setting '${value}' ignored for element-tag '${ele.tagName}'`
    );
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
