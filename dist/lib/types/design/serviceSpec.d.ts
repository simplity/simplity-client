import { Vo } from '..';
/**
 * serviceSpec describes a service. services are the basic contract between the client-app and the server-app
 */
export type ServiceSpec = {
    /**
     * name must match with the name with which it is mapped in the object
     */
    name: string;
    description?: string;
    serveGuests?: boolean;
    /**
     * service is requestd with this form as data-input
     */
    requestForm?: string;
    /**
     * the response contains this data
     */
    responseForm?: string;
};
/**
 * Data structure of the response for a service request.
 * This is the generic format. Each service will have it's specific Vo
 */
export type ServiceResponse = {
    /**
     * status code of request processing by the server
     */
    status: ServiceStatus;
    /**
     * human readable description of the status code
     */
    description: string;
    /**
     * optional if status is 'served'. Otherwise will contain at least one message with severity of error
     */
    messages?: DetailedMessage[];
    /**
     * output from service execution. relevant only if status is served
     */
    data?: Vo;
};
/**
 * status field in the response
 */
export type ServiceStatus = 
/**
 * Successfully completed.
 */
'completed'
/**
 * Service completed but with errors. Either the input data was invalid, or the intended action could not be taken for other reasons.
 */
 | 'completedWithErrors'
/**
 * Request does not specify a session id.
 */
 | 'sessionRequired'
/**
 * No session is active with this session id. Either the session has expired, or the id is invalid.
 */
 | 'noSuchSession'
/**
 * Invalid input data format.
 */
 | 'invalidDataFormat'
/**
 * No server is set up.
 */
 | 'noServer'
/**
 * Request does not specify a service name.
 */
 | 'serviceNameRequired'
/**
 * No such service is served by this app, or the service is not accessible to this user.
 */
 | 'noSuchService'
/**
 * error while communicating with the server
 */
 | 'communicationError'
/**
 * There was an internal error on the server. It is being looked into.
 */
 | 'serverError';
export declare const STATUS_DESCRIPTIONS: {
    [status in ServiceStatus]: string;
};
/**
 * Structure of a Message received as part of a response
 */
export type DetailedMessage = {
    /**
     * one of the pre-defined type
     */
    type: 'error' | 'warning' | 'info' | 'success';
    /**
     * unique name assigned to this message in the app
     */
    id: string;
    /**
     * formatted text in English that is ready to be rendered
     */
    text: string;
    /**
     * name of the field (primary one in case more than one field are involved) that caused
     * this error. undefined if this is not specific to any field.
     */
    fieldName?: string;
    /**
     * name of the table/object that the field is part of. undefined if this not relevant
     */
    objectName?: string;
    /**
     * 0-based row number in case the field in error is part of a table.
     */
    idx?: number;
    /**
     * run-time parameters that are used to compose this message. This is useful in i18n
     */
    params?: string[];
};
