/**
 * mapping a REST-styled end-point to service name. This is used to respond to a client that uses the REST-styled end points instead of asking for a service name
 */
export type EndPointMapping = {
    /**
     * common part of all end-points. e.g. some-division/someApp/
     */
    basePath: string;
    /**
     * common-prefix to be added to the specified service-name.
     * useful if service names follow some naming convention
     */
    serviceNamePrefix?: string;
    /**
     * mapping a request type to actual service name
     */
    paths: {
        [reqType in RequestType]?: string;
    };
};
type RequestType = 'any' | 'get' | 'post' | 'put' | 'patch' | 'delete';
export {};
