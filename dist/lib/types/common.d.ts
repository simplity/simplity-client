import { ValueType, VisualWidth } from '../..';
/**
 * entity string index
 */
export type StringMap<T> = {
    [name: string]: T;
};
/**
 * Technique to incorporate condition like (one of a,b, or c must be specified)
 */
export type OneOf<T> = {
    [K in keyof T]: {
        [P in K]: T[K];
    } & Partial<Record<Exclude<keyof T, K>, never>>;
}[keyof T];
/**
 * function type. type alias "FunctionDetails" defines the signature of each of these types
 */
export type FunctionType = 'global' | 'page' | 'form' | 'value' | 'request' | 'response' | 'format';
/**
 * data needs to be moved around, possibly across networks and programming paradigms.
 * Hence a string, number and boolean are used to represent value for the sic value types.
 * Date is a string like "yyyy-mm-dd", and time stamp is a string like "yyyy-mm-ddThh:MM:ss.fffZ"
 */
export type Value = string | number | boolean;
/**
 * array of values. all elements of an array are of same type
 */
export type ValueArray = string[] | number[] | boolean[];
/**
 * name-value pairs
 */
export type Values = StringMap<Value>;
export type AnyValue = Value | Values | ValueArray | Values[];
/**
 * generic data-structure that is used to get data from the server.
 * Note that Value[] is not allowed.
 */
export type Vo = {
    [key: string]: AnyValue | Vo | Vo[];
};
export type ValueFormatter = {
    /**
     * for text
     */
    casing?: CaseConverter;
    /**
     * e.g. to output 001 instead of 1
     */
    minDigits?: number;
    /**
     *million -> comma for every three digits
     crore -> indian commas
     xxx-xx-xxxx- -> for text formatting with special characters. anything other than x is a formatting character
     yyyy-mm-dd etc.. case insensitive. yy, yyyy, mm, dd, mmm (for JAN etc..) have fixed meaning. others are separators
     */
    separators?: 'million' | 'crore' | string;
    /**
     * 1000 means up to nearest 1000
     */
    roundUpTo?: number;
};
/**
 * case may be converted to upper, lower.
 * A field name like "fieldName" or "FieldName" or "field_name" is converted to "Field Name"
 */
export type CaseConverter = 'UPPER' | 'lower' | 'label';
/**
 * function that formats a value to text format and provides rendering attributes to be set
 * used by the client to mark-up a value being rendered.
 */
export type FormatterFn = (value: Value) => {
    value: string;
    attrs?: Markups;
};
/**
 * Markup attributes are name-value pairs.
 * name is the name of a mark-up, like "highlight", "below-range" etc..
 * a mark-up is set as a data-* attribute for the element.
 * e.g. data-highlight of data-align=right
 */
export type Markups = StringMap<string>;
/**
 * how to render a value, generally as a column in a table, but also can be used to render as a field
 */
export type ValueRenderingDetails = {
    /**
     * name by which the values are available in a row
     */
    name: string;
    /**
     * header label to be used
     */
    label: string;
    /**
     * value type helps is rendering, specifically, numbers may have to be right-justified
     */
    valueType: ValueType;
    /**
     * attributes data-* to be set for the header cells. This is the technique we use to associate effective style for the cell
     */
    labelAttributes?: Markups;
    /**
     * way to render the value. this is the name of a pre-defined formatter
     */
    valueFormatter?: ValueFormatter;
    /**
     * name of a pre-defined formatter-function
     */
    valueFormatterFn?: string;
};
/**
 * mapping width names with a specific style(s)
 */
export type WidthStyles = {
    [key in VisualWidth]?: string;
};
/**
 * child components are laid-out using a grid-bag-layout paradigm.
 * an app MUST specify one default grid-bag-layout, with name as 'default'
 */
export type GridBagStyle = {
    /**
     * 'default' is the name to be used for the style to be used as a default
     */
    name: string;
    /**
     * style to be used for the parent (this) component
     */
    parentStyle?: string;
    /**
     * style to be used for a child for which width is not specified
     */
    defaultChildStyle: string;
    /**
     * width values are to be mapped to the desired style
     */
    widthStyles: WidthStyles;
};
/**
 * field name and sort order
 */
export type SortBy = {
    field: string;
    descending?: boolean;
};
/**
 * a condition is like "field-1 != 33" or "field1 > field2 but < field3
 */
export type FilterCondition = {
    /**
     * name of the field used for filtering
     */
    field: string;
    comparator: Comparator;
    /**
     * value must be of the right type for the field and the comparator
     * use ${field-name} notation to refer to another field instead of a value.
     * e.g. value="${price}"
     */
    value: string | number | boolean;
    /**
     * required if the operator is between/range. ignored otherwise
     */
    toValue?: string | number;
};
/**
 * comparators for forming conditions like id = '1234'
 */
export type Comparator = '=' | '!=' | '<' | '<=' | '>' | '>=' | '><' | '^' | '~';
export type AlertType = 'success' | 'info' | 'warning' | 'error';
export type Alert = {
    type: AlertType;
    text: string;
};
/**
 * spec for an interface. contains all the test descriptions for each method.
 * can be used for it(...)
 */
export type Spec = {
    [method: string]: string[];
};
