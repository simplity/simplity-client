import { AppController, Module } from 'simplity-types';
export declare class ModuleElement {
    private readonly ac;
    private readonly module;
    readonly root: HTMLElement;
    private readonly menuItems;
    private readonly menuEle;
    constructor(ac: AppController, module: Module);
}
