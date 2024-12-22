import { FunctionType, StringMap } from './common';
import { AppDetails } from './design/appDesign';
import { Layout, MenuItem, Module } from './design/layout';
import { ValueList } from './design/list';
import { Page } from './design/page';
import { PageAlteration } from './design/pageAlteration';
import { Record } from './design/record';
import { ServiceResponse, ServiceSpec } from './design/serviceSpec';
import { Sql } from './design/sql';
import { PageTemplate } from './design/template';
import { ValueSchema } from './design/valueSchema';
/**
 * AppMetaData is a  collection of all the components that directly capture the design-time attributes/parameters
 * These are the components that the designer maintains.
 * some of these are used as-they-are while some of them are used to generate design-time components
 *  meta data subset of design-time components that have info for both thee the server side and the client side
 * this is processed to generate JSONs for the server-side and some type-scripts for the client-side
 */
export type AppMetaData = {
    /**
     * a subset of the parameters are relevant for the server.
     * application.json is created for these parameters.
     */
    appDetails: AppDetails;
    /**
     * ready responses are cached responses by serviceNames,  by the client.
     * we may also decide to shift them to the server side on a need basis.
     * this feature is useful during development and for demo purposes
     * if a ready response is available, the response is used instead of calling a service
     */
    cachedResponses?: StringMap<ServiceResponse>;
    /**
     * all functions defined for this app. Note that the function name has to be unique across all pages.
     * an App may follow naming convention like pageName.functionName if the app is quite large
     */
    functions?: StringMap<FunctionType>;
    /**
     * how the visual components are laid out on the canvas
     */
    layouts?: StringMap<Layout>;
    /**
     * Most of the messages used by the server are to be anyways rendered on the client.
     * It is possible that some messages are relevant only for the client.
     * However, we have not made any provision for this concept at this time.
     * All messages are known to both the server and the client
     * client can use this as it is, so no ts file is generated.
     * json file is generated for the server.
     */
    messages: StringMap<string>;
    menuItems?: StringMap<MenuItem>;
    modules?: StringMap<Module>;
    pageAlterations?: StringMap<PageAlteration>;
    pages?: StringMap<Page>;
    /**
     * records have info both the server and the client.
     * Server uses the term "clientForm" for compositeRecord.
     * Hence record.json files are created for simple/extended records.
     * form.json fields are created for composite records.
     * Client uses "form" for all the three types of records.
     * record.ts files are generated for all the records that are visible to the client-side
     *
     */
    records: StringMap<Record>;
    serviceSpecs?: StringMap<ServiceSpec>;
    /**
     * SQLs are server side components
     */
    sqls: StringMap<Sql>;
    templates?: StringMap<PageTemplate>;
    /**
     * values lists consist of both design-time and run-time.
     * server needs all of them, while the client doesn't keep track of the run-time ones.
     * json file is created for the server, and listSources.ts file is generated for the client
     */
    valueLists: StringMap<ValueList>;
    /**
     * value schemas are used the same way both on the server and on the client.
     * client can use the meta data s it is. No need to generate ts file.
     * valuesSchemas.json created for the server
     */
    valueSchemas: StringMap<ValueSchema>;
};
