import { JSDOM } from 'jsdom';
const jsdom = new JSDOM(`<!DOCTYPE html><body></body>`);
global.window = jsdom.window as any as Window & typeof globalThis;
global.document = jsdom.window.document;
