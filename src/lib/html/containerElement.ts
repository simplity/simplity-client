import { BaseComponent, FormController, NbrCols } from 'simplity-types';
import { BaseElement } from './baseElement';

export class ContainerElement extends BaseElement {
  constructor(
    fc: FormController | undefined,
    comp: BaseComponent,
    templateName: string,
    maxWidth: NbrCols
  ) {
    super(fc, comp, templateName, maxWidth);
  }
}
