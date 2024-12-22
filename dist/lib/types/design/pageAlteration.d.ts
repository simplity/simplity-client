import { StringMap, BaseComponent, PageAttributes } from '..';
/**
 * alterations, enhancements to a generated page.
 * May also be used to customize a page for a specific tenant
 */
export type PageAlteration = PageAttributes & {
    /**
     * key is the name of an existing comp as the reference for adding this new component
     */
    additions?: StringMap<ViewComponentAddition>;
    /**
     * names of comps to be removed
     */
    deletions?: StringMap<true>;
    /**
     * change attribute values of any component.
     * we have kept this free-form to accommodate all types of components
     */
    changes?: StringMap<any>;
};
export type ViewComponentAddition = {
    /**
     * should the new components be added before the referred component?
     * (false, default, means add it after the component)
     */
    insertBefore?: boolean;
    comps: BaseComponent[];
};
