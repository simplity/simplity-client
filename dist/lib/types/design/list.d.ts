import { StringMap } from '../';
/**
 * value-displayed Text pair that is generally used to
 * create an option element in a select(drop-down) element
 */
export type ListPair = {
    /**
     * internal value
     */
    value: string | number;
    /**
     * label being displayed for this value
     */
    label: string;
};
/**
 * an array of the pairs that are generally used as the data-structure behind a combo-box/select
 */
export type SimpleList = ListPair[];
/**
 * lists indexed by their corresponding key value
 */
export type KeyedList = StringMap<SimpleList>;
export type ValueList = FixedList | FixedKeyedList | RuntimeList;
export type FixedList = {
    name: string;
    listType: 'simple';
    list: SimpleList;
};
export type FixedKeyedList = {
    name: string;
    listType: 'keyed';
    keyedList: KeyedList;
};
export type RuntimeList = {
    name: string;
    listType: 'runtime';
    isKeyed: boolean;
    keyIsNumeric?: boolean;
    valueIsNumeric?: boolean;
    okToCache?: boolean;
    dbTableName: string;
    dbColumn1: string;
    dbColumn2: string;
    keyColumn?: string;
    tenantColumn?: string;
    activeColumn?: string;
    parentIdColumnName?: string;
    parentNameColumnName?: string;
};
