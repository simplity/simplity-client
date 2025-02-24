import { BaseElement } from './baseElement';
import { Chart } from 'chart.js/auto';
import { htmlUtil } from './htmlUtil';
const OPTIONS = {
    responsive: true, // Adapt to parent size
    maintainAspectRatio: true, // Keep a fixed ratio (e.g., 1:1 for pie)
    aspectRatio: 1, // Square chart (optional, adjust as needed)
};
export class ChartElement extends BaseElement {
    fc;
    chart;
    /**
     * for implementing sort feature
     */
    data = [];
    cc;
    chartEle;
    labels = [];
    fieldNames = [];
    constructor(fc, chart, maxWidth) {
        super(fc, chart, 'chart', maxWidth);
        this.fc = fc;
        this.chart = chart;
        if (!fc) {
            throw new Error(`Chart-component ${chart.name} is probably inside of a table?. Please check your page component design`);
        }
        this.chartEle = htmlUtil.getChildElement(this.root, 'chart');
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
    renderData(data, _columnNames) {
        let values;
        if (!Array.isArray(data)) {
            this.logger.error(`Invalid data received for chart ${this.name}`, data);
        }
        else {
            const arr = data;
            if (arr.length == 0) {
                this.logger.error(`empty array received as data for chart '${this.name}'`);
            }
            else {
                values = arr[0];
                if (arr.length > 1) {
                    this.logger.error(`Data has ${arr.length} rows for the chart '${this.name}'. Only the first row is used `);
                }
            }
        }
        if (!values) {
            this.chartEle.innerHTML = '';
            return;
        }
        this.data = [values];
        this.data;
        const d = [];
        for (const name of this.fieldNames) {
            d.push(values[name] || 0);
        }
        const config = {
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
    chartClicked(idx) {
        const field = this.chart.fields[idx];
        if (field?.onClick) {
            this.pc.act(field.onClick);
        }
    }
    /**
     * remove all rows that are rendered. Remove the header if it is dynamic
     */
    reset(_headerAsWell) {
        this.root.innerHTML = '';
    }
}
//# sourceMappingURL=chartElement.js.map