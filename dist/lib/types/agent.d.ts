import { Logger, StringMap, Vo, Service, ServiceResponse, ServerResponse } from '../..';
/**
 * Component that serves all services to the client-app.
 * Code from the client app MUST use this component, and never make any request to the server directly.
 */
export interface ServiceAgent {
    /**
     * This is an async function. it returns after initiating the process.
     * callers can either use async/wait to serialize their logic, or use .then() etc.. and move on with the rest of the logic
     * Note that this method does not throw exception on any error.
     * It catches any error, and creates an appropriate response with the error.
     * Hence it is more amenable  async-await style of coding
     *
     * @param serviceName to be served from the server
     * @param sessionId: optional token/sessionId if a session is established with the server
     * @param data: data for this service. undefined if this service does not take any input
     * @returns promise that will not throw any error. The returned response may contain error details
     */
    serve(serviceName: string, sessionId?: string, data?: Vo): Promise<ServerResponse>;
}
/**
 * Configuration parameters for the agent
 */
export type AgentConfigData = {
    /**
     * URL for the server. All requests are sent to this url.
     * Only local resources are used if the url is not set
     */
    serverUrl?: string;
    /**
     * if the App is using any logger, agent will use it as well.
     * else logged directly to the console
     */
    logger?: Logger;
    /**
     * mock responses for services. Note that there is one fixed response for a request, irrespective of the input data.
     * LocalService should be used if response is data-dependent
     */
    responses?: StringMap<ServiceResponse>;
    /**
     * some local logic based on which the response can be determined.
     * note that the service is called only if no ready response is available.
     */
    localServices?: StringMap<Service>;
};
