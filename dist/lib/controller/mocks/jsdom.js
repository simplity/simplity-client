import { JSDOM } from 'jsdom';
const jsdom = new JSDOM(`<!DOCTYPE html><body></body>`);
global.window = jsdom.window;
global.document = jsdom.window.document;
//# sourceMappingURL=jsdom.js.map