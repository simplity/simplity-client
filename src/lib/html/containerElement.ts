import { BaseComponent, FormController } from 'simplity-types';
import { BaseElement } from './baseElement';

export class ContainerElement extends BaseElement {
  constructor(
    fc: FormController | undefined,
    comp: BaseComponent,
    templateName: string
  ) {
    super(fc, comp, templateName);
  }
}
