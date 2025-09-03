import { AgentConfigData, ServiceAgent, ServiceStatus } from 'simplity-types';
export declare const STATUS_DESCRIPTIONS: {
    [status in ServiceStatus]: string;
};
export declare const serviceAgent: {
    /**
     *
     * @param configData
     * @returns
     */
    newAgent: (configData: AgentConfigData) => ServiceAgent;
};
