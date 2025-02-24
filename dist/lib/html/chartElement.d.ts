import { Chart as ChartComp, FormController, Vo } from 'simplity-types';
import { BaseElement } from './baseElement';
export declare class ChartElement extends BaseElement {
    readonly fc: FormController | undefined;
    readonly chart: ChartComp;
    /**
     * for implementing sort feature
     */
    private data;
    private readonly cc;
    private readonly chartEle;
    private readonly labels;
    private readonly fieldNames;
    constructor(fc: FormController | undefined, chart: ChartComp, maxWidth: number);
    /**
     *
     * @param data
     * @param columnNames is specified, we are to render these columns, in that order
     */
    renderData(data: Vo[], _columnNames?: string[]): void;
    private chartClicked;
    /**
     * remove all rows that are rendered. Remove the header if it is dynamic
     */
    reset(_headerAsWell?: boolean): void;
}
