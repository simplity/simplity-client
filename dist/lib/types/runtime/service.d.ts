import { FilterCondition, ServiceResponse, SortBy, Vo } from '..';
/**
 * Service is a function that responds with its response when invoked with its specified, possibly optional, input data
 */
export type Service = (data?: Vo) => ServiceResponse;
/**
 * request for a ListService must contain certain data elements
 */
export type ListRequestVo = {
    /**
     * name of the list
     */
    list: string;
    /**
     * key value if the list is keyed
     */
    key?: string | number;
    /**
     * if this is a keyed-list, but we need all the lists for all possible keys
     */
    forAllKeys?: boolean;
};
/**
 * input parameters to the filter API
 */
export type FilterRequestVo = {
    /**
     * default is to get all rows.
     * Note that there is a default max rows that any service will respond back with.
     */
    maxRows?: number;
    /**
     * array of filter conditions. Default is to use no filters, and select all.
     */
    filters?: FilterCondition[];
    /**
     * default is to use the default-sort used by the underlying form definition, if any
     * fields to be sorted by. Sorting on text fields is case-insensitive
     */
    sorts?: SortBy[];
    /**
     * fields names to be selected. These are the columns in the table being rendered
     * default is to get all the fields
     */
    fields?: string[];
};
/**
 * server may return session-id as well..
 */
export type ServerResponse = ServiceResponse & {
    sessionId?: string;
};
/**
 * requesting a server to serve a service
 */
export type ServerRequest = {
    service: string;
    sessionId?: string;
    data?: Vo;
};
