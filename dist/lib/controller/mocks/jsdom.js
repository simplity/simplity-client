"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsdom_1 = require("jsdom");
const jsdom = new jsdom_1.JSDOM(`<!DOCTYPE html><body></body>`);
global.window = jsdom.window;
global.document = jsdom.window.document;
//# sourceMappingURL=jsdom.js.map