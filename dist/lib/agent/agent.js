import { STATUS_DESCRIPTIONS, } from 'simplity-types';
/*
 * utility to get an instance of a Service Agent
 */
export const serviceAgent = {
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
    responses;
    localServices;
    serverUrl;
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
        let description = STATUS_DESCRIPTIONS[status];
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