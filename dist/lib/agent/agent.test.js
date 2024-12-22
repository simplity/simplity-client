"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const simplity_types_1 = require("simplity-types");
const agent_1 = require("./agent");
const serverServices = {
    service2: getService('service2', 'server'),
    service4: getService('service4', 'server'),
    service5: getService('service5', 'server'),
    service6: getService('service6', 'server'),
};
const localServices = {
    service1: getService('service1', 'local'),
    service3: getService('service3', 'local'),
    service5: getService('service5', 'local'),
    service6: getService('service6', 'local'),
};
function getService(service, source) {
    return ( /* data: Vo | undefined */) => {
        return {
            status: 'completed',
            description: simplity_types_1.STATUS_DESCRIPTIONS['completed'],
            data: { service, source },
        };
    };
}
const cachedResponses = {
    service0: getResponse('service0'),
    service3: getResponse('service3'),
    service4: getResponse('service4'),
    service6: getResponse('service6'),
};
function getResponse(service) {
    return {
        status: 'completed',
        description: 'All Ok',
        data: { service, source: 'cache' },
    };
}
const getResponseCases = [
    {
        service: 'service0',
        desc: 'only in cache. Should respond with the cached response',
        source: 'cache',
    },
    {
        service: 'service1',
        desc: 'only local service. Should respond from the local service.',
        source: 'local',
    },
    {
        service: 'service2',
        desc: 'only on server. should respond from the server',
        source: 'server',
    },
    {
        service: 'service3',
        desc: 'cached+local. should respond with the cached response',
        source: 'cache',
    },
    {
        service: 'service4',
        desc: 'cached+server. should respond with the server',
        source: 'cache',
    },
    {
        service: 'service5',
        desc: 'local+server. should respond from the server',
        source: 'local',
    },
    {
        service: 'service6',
        desc: 'cached+local+server. should respond from the cache',
        source: 'cache',
    },
];
const config1 = {
    localServices,
    responses: cachedResponses,
    serverUrl: 'aaaa',
};
const config2 = {
    localServices,
    responses: cachedResponses,
};
const ERROR_SERVICE = 'errorService';
/**
 * for mocking app
 */
function serve(reqStr) {
    let req;
    try {
        req = JSON.parse(reqStr);
    }
    catch (e) { }
    if (!req) {
        return {
            status: 'invalidDataFormat',
            description: 'input data is not a valid json',
        };
    }
    if (req.service === ERROR_SERVICE) {
        throw 'Communication error';
    }
    const service = serverServices[req.service];
    if (!service) {
        return {
            status: 'noSuchService',
            description: `${req.service} is not recognized a as a service`,
        };
    }
    const resp = service(req.data);
    if (resp) {
        return resp;
    }
    //local service would return undefined to signal that its action should be ignored
    //but server emulator would do it to signal a general error
    return {
        status: 'serverError',
        description: `service ${req.service} could not be completed because of an error on the server.`,
    };
}
//mock fetch to run our server-emulator
// @ts-expect-error
global.fetch = async (_input, init) => {
    const reqStr = init.body + '';
    const resp = serve(reqStr);
    return {
        json: async () => {
            return resp;
        },
    };
};
/*
describe('Session Management', () => {
  it('should send sessionId only after it is received from the server', async () => {
    const agent = serviceAgent.newAgent(config1);

    //service-request with no data
    let resp = await agent.serve(CHECK_SERVICE);
    expect(resp!.data!.gotSessionId).toBeFalsy();

    //service-request with data to set session-id
    resp = await agent.serve(SET_SERVICE);
    expect(resp!.data!.gotSessionId).toBeFalsy();

    //service-request to check if agent sent session-d
    resp = await agent.serve(CHECK_SERVICE);
    expect(resp!.data!.gotSessionId).toBe(true);
  });
});
*/
function testSessionManagement() {
    (0, globals_1.describe)('Locating Server', () => {
        const agent = agent_1.serviceAgent.newAgent(config2);
        (0, globals_1.it)('should succeed when serverUrl is not set but a local service is  available', async () => {
            const resp = await agent.serve('service1');
            (0, globals_1.expect)(resp.status).toBe('completed');
        });
        (0, globals_1.it)('should set status to noServer when the service requires access to server', async () => {
            const resp = await agent.serve('service12345');
            (0, globals_1.expect)(resp.status).toBe('noServer');
        });
    });
    (0, globals_1.describe)('Communication Error Handling', () => {
        const agent = agent_1.serviceAgent.newAgent(config1);
        (0, globals_1.it)('should set status to communicationError when there is an error while communicating with the server', async () => {
            const resp = await agent.serve('errorService');
            (0, globals_1.expect)(resp.status).toBe('communicationError');
        });
    });
}
function testServe() {
    (0, globals_1.describe)('serve', () => {
        const agent = agent_1.serviceAgent.newAgent(config1);
        globals_1.test.each(getResponseCases)('$desc', async ({ service, source }) => {
            const resp = await agent.serve(service);
            (0, globals_1.expect)(resp.status).toBe('completed');
            (0, globals_1.expect)(resp.data?.service).toBe(service);
            (0, globals_1.expect)(resp.data?.source).toBe(source);
        });
    });
}
function testAll() {
    testSessionManagement();
    testServe();
}
/// actual testing code here
(0, globals_1.describe)('Server Agent', () => {
    testAll();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWdlbnQudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvYWdlbnQvYWdlbnQudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDJDQUEyRDtBQUMzRCxtREFRd0I7QUFDeEIsbUNBQXVDO0FBRXZDLE1BQU0sY0FBYyxHQUF1QjtJQUN6QyxRQUFRLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUM7SUFDMUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDO0lBQzFDLFFBQVEsRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQztJQUMxQyxRQUFRLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUM7Q0FDM0MsQ0FBQztBQUNGLE1BQU0sYUFBYSxHQUF1QjtJQUN4QyxRQUFRLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUM7SUFDekMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDO0lBQ3pDLFFBQVEsRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQztJQUN6QyxRQUFRLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUM7Q0FDMUMsQ0FBQztBQUVGLFNBQVMsVUFBVSxDQUFDLE9BQWUsRUFBRSxNQUFjO0lBQ2pELE9BQU8sRUFBQywwQkFBMEIsRUFBRSxFQUFFO1FBQ3BDLE9BQU87WUFDTCxNQUFNLEVBQUUsV0FBVztZQUNuQixXQUFXLEVBQUUsb0NBQW1CLENBQUMsV0FBVyxDQUFDO1lBQzdDLElBQUksRUFBRSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUU7U0FDMUIsQ0FBQztJQUNKLENBQUMsQ0FBQztBQUNKLENBQUM7QUFFRCxNQUFNLGVBQWUsR0FBK0I7SUFDbEQsUUFBUSxFQUFFLFdBQVcsQ0FBQyxVQUFVLENBQUM7SUFDakMsUUFBUSxFQUFFLFdBQVcsQ0FBQyxVQUFV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