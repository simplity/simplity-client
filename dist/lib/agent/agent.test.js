"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
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
            description: agent_1.STATUS_DESCRIPTIONS['completed'],
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
//# sourceMappingURL=agent.test.js.map