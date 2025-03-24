import { Chart, ChartController, FormController, Values, Vo } from 'simplity-types';
import { ChartElement } from '../html/chartElement';
export declare class CC implements ChartController {
    readonly fc: FormController;
    private readonly view;
    private data;
    readonly name: string;
    readonly type = "chart";
    readonly pc: import("simplity-types").PageController;
    readonly chart: Chart;
    constructor(fc: FormController, view: ChartElement);
    setDisplayState(compName: string, settings: Values): boolean;
    getFormName(): string | undefined;
    receiveData(data: Vo | Vo[], _childName?: string): void;
    setData(data: Vo | Vo[]): void;
    getData(): Vo | Vo[];
    isModified(): boolean;
    isValid(): boolean;
    validate(): boolean;
    resetData(fields?: string[]): void;
}
