import {
  Chart,
  ChartController,
  FormController,
  Values,
  Vo,
} from 'simplity-types';
import { ChartElement } from '../html/chartElement';

export class CC implements ChartController {
  private data: Vo[] = [];
  public readonly name;
  public readonly type = 'chart';
  public readonly pc;
  public readonly chart: Chart;

  constructor(
    public readonly fc: FormController,
    private readonly view: ChartElement
  ) {
    this.name = view.name;
    this.pc = fc.pc;
    this.chart = view.chart;
  }

  setDisplayState(compName: string, settings: Values): boolean {
    console.error(
      `Chart Component '${this.name}' : setDisplayState() for a sub-component named ${compName} is ignored`
    );
    return false;
  }

  getFormName(): string | undefined {
    return undefined;
  }

  receiveData(data: Vo | Vo[], _childName?: string): void {
    this.setData(data);
  }

  setData(data: Vo | Vo[]): void {
    if (Array.isArray(data)) {
      this.data = data;
      this.view.renderData(data);
      return;
    }
    console.error(
      `Chart Component ${this.name}: Non-array data is received. Data Ignored`,
      data
    );
  }
  getData(): Vo | Vo[] {
    return this.data;
  }
  isValid(): boolean {
    return true;
  }
  validate(): boolean {
    return true;
  }
}
