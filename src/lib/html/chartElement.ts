import { Chart as ChartComp, FormController, Values, Vo } from 'simplity-types';
import { BaseElement } from './baseElement';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { htmlUtil } from './htmlUtil';

const OPTIONS = {
  responsive: true, // Adapt to parent size
  maintainAspectRatio: true, // Keep a fixed ratio (e.g., 1:1 for pie)
  aspectRatio: 1, // Square chart (optional, adjust as needed)
};

export class ChartElement extends BaseElement {
  /**
   * for implementing sort feature
   */
  private data: Vo[] = [];
  private readonly cc;
  private readonly chartEle;
  private readonly labels: string[] = [];
  private readonly fieldNames: string[] = [];

  constructor(
    public readonly fc: FormController | undefined,
    public readonly chart: ChartComp,
    maxWidth: number
  ) {
    super(fc, chart, 'chart', maxWidth);
    if (!fc) {
      throw new Error(
        `Chart-component ${chart.name} is probably inside of a table?. Please check your page component design`
      );
    }

    this.chartEle = htmlUtil.getChildElement(
      this.root,
      'chart'
    ) as HTMLCanvasElement;
    this.cc = fc.newChartController(this);
    this.cc;
    for (const field of this.chart.fields) {
      this.labels.push(field.label);
      this.fieldNames.push(field.name);
    }
  }

  /**
   *
   * @param data
   * @param columnNames is specified, we are to render these columns, in that order
   */
  renderData(data: Vo[], _columnNames?: string[]): void {
    let values: Values | undefined;
    if (!Array.isArray(data)) {
      this.logger.error(`Invalid data received for chart ${this.name}`, data);
    } else {
      const arr = data as Values[];
      if (arr.length == 0) {
        this.logger.error(
          `empty array received as data for chart '${this.name}'`
        );
      } else {
        values = arr[0];
        if (arr.length > 1) {
          this.logger.error(
            `Data has ${arr.length} rows for the chart '${this.name}'. Only the first row is used `
          );
        }
      }
    }
    if (!values) {
      this.chartEle.innerHTML = '';
      return;
    }
    this.data = [values];
    this.data;
    const d: number[] = [];
    for (const name of this.fieldNames) {
      d.push((values[name] as number) || 0);
    }

    const config: ChartConfiguration = {
      options: {
        ...OPTIONS,
        onClick: (event, elements, chart) => {
          if (elements.length) {
            this.chartClicked(elements[0].index);
          }
        },
      },
      type: 'pie',
      data: {
        labels: this.labels,
        datasets: [
          {
            data: d,
          },
        ],
      },
    };
    new Chart(this.chartEle, config);
  }

  private chartClicked(idx: number): void {
    const field = this.chart.fields[idx];
    if (field?.onClick) {
      this.pc.act(field.onClick);
    }
  }

  /**
   * remove all rows that are rendered. Remove the header if it is dynamic
   */
  public reset(_headerAsWell?: boolean) {
    this.root.innerHTML = '';
  }
}
