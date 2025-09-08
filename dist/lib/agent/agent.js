"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceAgent = exports.STATUS_DESCRIPTIONS = void 0;
exports.STATUS_DESCRIPTIONS = {
    communicationError: 'An error was encountered while communicating with the server',
    completed: 'Completed with success',
    completedWithErrors: 'Completed, but there were errors',
    invalidDataFormat: 'The input data was not appropriate for this service',
    noServer: 'No server is set up',
    noSuchService: 'Service name is invalid, or this server is configured not to respond to this service',
    noSuchSession: 'Session id for this conversational mode is invalid',
    serverError: 'The server could not invoke this service due to a general error on the server',
    serviceNameRequired: 'No service name was specified',
    sessionRequired: 'this service request valid only in a conversational mode. Hence a session id is required',
};
/*
 * utility to get an instance of a Service Agent
 */
exports.serviceAgent = {
    /**
     *
     * @param configData
     * @returns
     */
    newAgent: (configData) => {
        return new SA(configData);
    },
};
class SA {
    constructor(configData) {
        this.responses = configData.responses || {};
        this.localServices = configData.localServices || {};
        this.serverUrl = configData.serverUrl;
    }
    async serve(service, sessionId, data) {
        let r = this.responses[service];
        if (r !== undefined) {
            //got it from our cache
            return JSON.parse(JSON.stringify(r));
        }
        //do we have a local service?
        const ls = this.localServices[service];
        if (ls) {
            r = ls(data);
            // a local service may pretend its absence by returning this status.
            if (r.status !== 'noSuchService') {
                return JSON.parse(JSON.stringify(r));
            }
        }
        //send a request to the server
        let req = { service };
        if (sessionId) {
            req.sessionId = sessionId;
        }
        if (data) {
            req.data = data;
        }
        let status = 'noServer';
        let description = exports.STATUS_DESCRIPTIONS[status];
        if (!this.serverUrl) {
            return {
                status,
                description,
            };
        }
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req),
        };
        try {
            const response = await fetch(this.serverUrl, options);
            return (await response.json());
        }
        catch (err) {
            status = 'communicationError';
            description = `Error while communicating with server URL: ${this.serverUrl}`;
            return {
                status,
                description,
            };
        }
    }
}
//# sourceMappingURL=agent.js.map