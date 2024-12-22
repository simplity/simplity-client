"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsdom_1 = require("jsdom");
const jsdom = new jsdom_1.JSDOM(`<!DOCTYPE html><body></body>`);
global.window = jsdom.window;
global.document = jsdom.window.document;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNkb20uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbGliL2NvbnRyb2xsZXIvbW9ja3MvanNkb20udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpQ0FBOEI7QUFDOUIsTUFBTSxLQUFLLEdBQUcsSUFBSSxhQUFLLENBQUMsOEJBQThCLENBQUMsQ0FBQztBQUN4RCxNQUFNLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUEyQyxDQUFDO0FBQ2xFLE1BQU0sQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMifQ==