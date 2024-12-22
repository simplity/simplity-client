"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceAgent = void 0;
const simplity_types_1 = require("simplity-types");
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
        let description = simplity_types_1.STATUS_DESCRIPTIONS[status];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWdlbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2FnZW50L2FnZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1EQVF3QjtBQUV4Qjs7R0FFRztBQUVVLFFBQUEsWUFBWSxHQUFHO0lBQzFCOzs7O09BSUc7SUFDSCxRQUFRLEVBQUUsQ0FBQyxVQUEyQixFQUFnQixFQUFFO1FBQ3RELE9BQU8sSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDNUIsQ0FBQztDQUNGLENBQUM7QUFFRixNQUFNLEVBQUU7SUFLTixZQUFZLFVBQTJCO1FBQ3JDLElBQUksQ0FBQyxTQUFTLEdBQUcsVUFBVSxDQUFDLFNBQVMsSUFBSSxFQUFFLENBQUM7UUFDNUMsSUFBSSxDQUFDLGFBQWEsR0FBRyxVQUFVLENBQUMsYUFBYSxJQUFJLEVBQUUsQ0FBQztRQUNwRCxJQUFJLENBQUMsU0FBUyxHQUFHLFVBQVUsQ0FBQyxTQUFTLENBQUM7SUFDeEMsQ0FBQztJQUVNLEtBQUssQ0FBQyxLQUFLLENBQ2hCLE9BQWUsRUFDZixTQUFrQixFQUNsQixJQUFTO1FBRVQsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNoQyxJQUFJLENBQUMsS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUNwQix1QkFBdUI7WUFDdkIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2QyxDQUFDO1FBRUQsNkJBQTZCO1FBQzdCLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDdkMsSUFBSSxFQUFFLEVBQUUsQ0FBQztZQUNQLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDYixvRUFBb0U7WUFDcEUsSUFBSSxDQUFDLENBQUMsTUFBTSxLQUFLLGVBQWUsRUFBRSxDQUFDO2dCQUNqQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLENBQUM7UUFDSCxDQUFDO1FBRUQsOEJBQThCO1FBQzlCLElBQUksR0FBRyxHQUFrQixFQUFFLE9BQU8sRUFBRSxDQUFDO1FBQ3JDLElBQUksU0FBUyxFQUFFLENBQUM7WUFDZCxHQUFHLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztRQUM1QixDQUFDO1FBRUQsSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUNULEdBQUcsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLENBQUM7UUFFRCxJQUFJLE1BQU0sR0FBa0IsVUFBVSxDQUFDO1FBQ3ZDLElBQUksV0FBVyxHQUFXLG9DQUFtQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRXRELElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDcEIsT0FBTztnQkFDTCxNQUFNO2dCQUNOLFdBQVc7YUFDWixDQUFDO1FBQ0osQ0FBQztRQUVELE1BQU0sT0FBTyxHQUFHO1lBQ2QsTUFBTSxFQUFFLE1BQU07WUFDZCxPQUFPLEVBQUU7Z0JBQ1AsY0FBYyxFQUFFLGtCQUFrQjthQUNuQztZQUNELElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQztTQUMxQixDQUFDO1FBRUYsSUFBSSxDQUFDO1lBQ0gsTUFBTSxRQUFRLEdBQUcsTUFBTSxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUN0RCxPQUFPLENBQUMsTUFBTSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQW1CLENBQUM7UUFDbkQsQ0FBQztRQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDYixNQUFNLEdBQUcsb0JBQW9CLENBQUM7WUFDOUIsV0FBVyxHQUFHLDhDQUE4QyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDN0UsT0FBTztnQkFDTCxNQUFNO2dCQUNOLFdBQVc7YUFDWixDQUFDO1FBQ0osQ0FBQztJQUNILENBQUM7Q0FDRiJ9