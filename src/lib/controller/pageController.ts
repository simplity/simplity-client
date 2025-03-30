import { loggerStub } from '../logger-stub/logger';
import {
  NavigationAction,
  FormAction,
  FilterAction,
  FunctionAction,
  Page,
  FieldView,
  PageView,
  PageFunction,
  Value,
  Vo,
  Values,
  FilterCondition,
  StringMap,
  PageController,
  AppController,
  Form,
  FormFunction,
  GlobalFunction,
  FormController,
  Alert,
  DetailedMessage,
  FnStatus,
  ValueValidationFn,
  ButtonView,
  Button,
  ServiceAction,
  Action,
  RequestFunction,
  ResponseFunction,
  AnyValue,
  SimpleList,
  KeyedList,
  FormOperation,
  ServiceRequestOptions,
  DataController,
  DisplayAction,
  NavigationOptions,
} from 'simplity-types';
import { FC } from './formController';
import { app } from './app';

type StringSet = StringMap<boolean>;

type ActionParameters = {
  fc?: FormController;
  msgs: DetailedMessage[];
  activeActions: StringSet;
  /**
   * additional parameters for a function passed at run time
   */
  additionalParams?: StringMap<any>;
};

const logger = loggerStub.getLogger();
const FORM_NAME = 'ROOT';

const FIELD_REGEX = /^\${.+}$/;
export class PC implements PageController {
  // ///////// attributes that are non-state : they are immutable
  public readonly name: string;
  /**
   * controller for the root form.
   */
  public readonly fc: FormController;
  public readonly ac: AppController;
  /**
   * meta data for this page
   */
  private readonly page: Page;
  /**
   * page class/component associated with this service
   */
  private readonly pageView: PageView;

  private readonly buttonsToDisplay: {
    button: ButtonView;
    show: boolean;
  }[] = [];

  /**
   * is this page for saving data? (for add or update depending on the mode)
   */
  private forSave = false;
  /**
   * relevant if forSave is true.
   * true if the page is invoked with keys, and hence we are updating
   */
  private saveIsUpdate = false;

  // //////////// State (mutable) attributes

  /**
   * title of the page may have dynamic content (field) in that.
   * this field has the calculated string, based on current values
   */
  private currentTitle: string | undefined;

  /**
   * set to true if user changes any field value
   */
  private isModified = false;

  /**
   * values that are set at run time at the page-context.
   * this context is checked for preparing the payload using params.
   */
  private values: StringMap<AnyValue | Vo> = {};

  /**
   * runtime actions are triggered by view components that may be created at run time, needing onclick-action.
   */
  private readonly functions: StringMap<() => unknown> = {};
  private readonly actions: StringMap<Action> = {};
  private readonly lists: StringMap<SimpleList | KeyedList> = {};

  public constructor(pageView: PageView) {
    this.ac = app.getCurrentAc();
    this.pageView = pageView;
    this.page = pageView.page;
    /**
     * we make a copy of actions because we may add actions dynamically
     */
    if (this.page.actions) {
      this.actions = { ...this.page.actions };
    }
    this.name = this.page.name;

    let form: Form | undefined = undefined;
    let formName = this.page.formName;
    if (formName) {
      form = this.ac.getForm(formName);
    }

    this.fc = new FC(FORM_NAME, this, form);
  }

  pageRendered(): void {
    this.fc.formRendered();
    //we may have to enable/disable buttons
    this.setButtonDisplays(this.page.leftButtons);
    this.setButtonDisplays(this.page.rightButtons);
    this.setButtonDisplays(this.page.middleButtons);
  }

  pageLoaded(): void {
    logger.info(`page ${this.name}loaded`, this);
    /**
     * do we have input data for this page?
     */
    const expectedInputs = this.page.inputs;

    const inputNames: string[] = [];
    const inputValues: Values = {};

    if (expectedInputs) {
      /**
       * assign input parameters into the page
       */
      const inp = this.pageView.inputs || {};
      for (const [key, isRequired] of Object.entries(expectedInputs)) {
        const val = inp[key];
        if (val !== undefined) {
          inputValues[key] = val;
          inputNames.push(key);
        } else if (isRequired && !this.page.inputIsForUpdate) {
          throw new Error(
            `Input value missing for parameter ${key} for page ${this.name}`
          );
        }
      }
    }

    if (inputNames.length) {
      this.fc.setData(inputValues);
      if (this.page.inputIsForUpdate) {
        this.forSave = true;
      }
      /**
       * it is possible that some parent field is also sent along with key fields.
       * in such a case, it is update if all fields are recd.
       */
      this.saveIsUpdate = this.fc.hasKeyValues();
    }

    if (this.page.onLoadActions) {
      if (this.page.inputIsForUpdate && inputNames.length === 0) {
        // onload is meant only for update mode. onload not triggered if this is not for update but "save" or "new"
      } else {
        for (const actionName of this.page.onLoadActions) {
          console.info(`Onload action ${actionName} being initiated`);
          this.act(actionName, this.fc, undefined);
        }
      }
    }

    this.checkTitle();
  }

  getFormController(): FormController {
    return this.fc;
  }

  setVariable(name: string, value: AnyValue | Vo): void {
    this.values[name] = value;
  }

  getVariable(name: string): AnyValue | Vo | undefined {
    return this.values[name];
  }

  setModifiedStatus(isModified: boolean): void {
    this.isModified = isModified;
  }

  isValid(): boolean {
    return this.fc.isValid();
  }
  /**
   *
   * @param messages
   */
  public showMessages(messages: DetailedMessage[]): void {
    if (!messages.length) {
      return;
    }

    const alerts: Alert[] = [];
    for (let msg of messages) {
      const text = this.ac.getMessage(msg.id, msg.params, msg.text);
      alerts.push({ type: msg.type, text: text! });
    }
    this.ac.showAlerts(alerts);
  }

  getList(control: FieldView, key?: string | number | undefined): void {
    const listName = control.field.listName;
    if (!listName) {
      logger.warn(
        `Control ${control.name} does not have listName, but a list is requested for it. Request ignored`
      );
      return;
    }

    let localList = this.lists[listName];
    if (localList) {
      const isSimple = Array.isArray(localList);

      let list: SimpleList = [];
      if (isSimple) {
        list = localList as SimpleList;
      } else {
        if (key !== undefined) {
          list = (localList as KeyedList)[key] || [];
        } else {
          logger.error(
            `List ${listName} is a keyed list but no key value is specified while requesting this list for control "${control.name}" `
          );
        }
      }
      control.setList(list);
      return;
    }

    this.ac.getList(listName, false, key).then((list) => {
      control.setList(list);
    });
  }

  getServiceName(
    formName: string | undefined,
    operation: FormOperation,
    messages: DetailedMessage[]
  ): string {
    if (!formName) {
      addMessage(
        `Form controller ${this.name} is not associated with a form. Can not do form based service`,
        messages
      );
      return '';
    }
    const form = this.ac.getForm(formName);

    const ops = form.operations;
    if (!ops) {
      addMessage(
        `Form ${form.name} is not designed for any form operation. Can not do form based service`,
        messages
      );
      return '';
    }

    if (!form.serveGuests) {
      if (!this.ac.getUser()) {
        addMessage(`User needs to login for this operation`, messages);
        return '';
      }
    }

    if (!ops[operation]) {
      addMessage(
        `operation '${operation}' is not allowed on the form ${this.name}`,
        messages
      );
      return '';
    }

    return operation + '_' + form.name;
  }
  requestService(serviceName: string, options?: ServiceRequestOptions): void {
    if (!options) {
      options = {};
    }
    const controller = options.fc || this.fc;

    this.ac.serve(serviceName, options.payload, false).then((resp) => {
      logger.info(`Service ${serviceName} returned.`, resp);
      //we have to show messages
      if (resp.messages) {
        this.showMessages(resp.messages);
      }

      const ok = resp.status === 'completed';
      if (ok) {
        const data = resp.data || {};
        if (options.callback) {
          options.callback(data);
        } else {
          controller.receiveData(data, options.targetPanelName);
        }
      }
    });
  }

  /**
   * to be called by a run-time app-specific function.
   * This feature is designed to cater to a situation where the details of an action can not be specified at design time.
   * @param action
   * @param controller defaults to the root form controller.
   * A child-form-controller may be passed in case some field values are to be taken from that form as part of this action.
   * @param params
   */
  takeAction(
    action: Action,
    controller?: FormController,
    additionalParams?: StringMap<any>
  ): void {
    const ap: ActionParameters = {
      msgs: [],
      fc: controller || this.fc,
      activeActions: {},
      additionalParams,
    };

    /**
     * actions may trigger other actions that may lead to infinite-loops.
     * we treat recursive call to the  same action as an infinite-loop.
     */
    this.doAct(action.name, ap, action);
  }

  act(
    actionName: string,
    controller?: FormController,
    additionalParams?: StringMap<any>
  ): void {
    /**
     * run time functions override design time actions.
     * Also, run time action is just a function, and has no feature for "before" or "after" action
     */
    const fn = this.functions[actionName];
    if (fn) {
      fn();
      return;
    }
    const ap: ActionParameters = {
      msgs: [],
      fc: controller || this.fc,
      activeActions: {},
      additionalParams,
    };

    /**
     * actions may trigger other actions that may lead to infinite-loops.
     * we treat recursive call to the  same action as an infinite-loop.
     */
    this.doAct(actionName, ap);
  }

  addList(name: string, list: SimpleList | KeyedList): void {
    this.lists[name] = list;
  }

  addFunction(name: string, fn: () => unknown): void {
    this.functions[name] = fn;
  }

  getFieldValue(qualifiedName: string): Value | undefined {
    const parts = qualifiedName.split('.');
    const fieldName = parts.pop()!;
    let fc = this.fc;
    if (parts.length) {
      for (const part of parts) {
        const c = fc.getController(part);
        if (!c) {
          logger.error(
            `No value could be determined for field '${qualifiedName}' because the sub-form '${part}' does not exist `
          );
          return undefined;
        }
        if (c.type !== 'form') {
          logger.error(
            `No value could be determined for field '${qualifiedName}' because the sub-form '${part}' is of type '${c.type}'. SUb forms must be of type 'form'`
          );
          return undefined;
        }
        fc = c as FormController;
      }
    }
    const v = fc.getFieldValue(fieldName);
    if (v === undefined) {
      logger.error(`Field '${qualifiedName}' does not exist`);
    }
    return v;
  }

  callFunction(
    name: string,
    params?: StringMap<any>,
    msgs?: DetailedMessage[],
    controller?: FormController
  ): FnStatus {
    const entry = this.ac.getFn(name);
    const status: FnStatus = { allOk: false };
    if (!msgs) {
      msgs = [];
    }
    if (!entry) {
      addMessage(
        `function ${name} is not defined but is being requested`,
        msgs
      );
      return status;
    }

    let ret: unknown = undefined;
    const fnType = entry.type;
    try {
      status.allOk = true;
      switch (fnType) {
        case 'form':
          if (controller) {
            ret = (entry.fn as FormFunction)(controller, params, msgs);
          } else {
            logger.warn(
              `function ${name} is of type "form" but is invoked with no data-controller. Root dc is assumed.`
            );
            ret = (entry.fn as FormFunction)(this.fc, params, msgs);
          }
          break;

        case 'global':
          ret = (entry.fn as GlobalFunction)(this.ac, params, msgs);
          break;

        case 'page':
          ret = (entry.fn as PageFunction)(this, params, msgs);
          break;

        case 'value':
          logger.warn(
            `function ${name} is a validation function, but is being called in a non-validation context in page ${this.name}`
          );
          ret = (entry.fn as ValueValidationFn)(params as { value: string });
          break;

        case 'request':
        case 'response':
          addMessage(
            `function ${name} is defined with type="${fnType}".  It should not be invoked on its own. (It is used internally by the page controller with a serviceAction with which this function may be associated.)`,
            msgs
          );
          break;

        default:
          addMessage(
            `function ${name} is defined with type="${fnType}", but this type of function is not yet implemented.`,
            msgs
          );
          break;
      }
    } catch (e) {
      let msg = `Error while calling function ${name}: `;
      if (e instanceof Error) {
        const err = e as Error;
        console.error(err.stack);

        msg += err.message;
      } else {
        msg += e;
      }
      addMessage(msg, msgs);
      status.allOk = false;
    }
    status.returnedValue = ret;
    return status;
  }

  private setButtonDisplays(buttons: Button[] | undefined) {
    if (!buttons) {
      return;
    }
    for (const btn of buttons) {
      const enable = btn.enableWhen;
      if (!enable) {
        continue;
      }
      const control = this.fc.getChild(btn.name);
      if (!control) {
        continue;
      }
      this.buttonsToDisplay.push({
        button: control as ButtonView,
        show: enable === 'valid',
      });
    }
  }

  private checkTitle() {
    let title = this.page.titlePrefix || '';
    if (this.page.titleField) {
      const val = this.fc.getFieldValue(this.page.titleField) || '  ';
      title += val; // it will come later?
    }

    if (this.page.titleSuffix) {
      title += this.page.titleSuffix;
    }

    if (title !== this.currentTitle) {
      this.currentTitle = title;
      this.ac.setPageTitle(title);
    }
  }

  private async serve(
    serviceName: string,
    fc: FormController,
    data?: Vo,
    targetChild?: string,
    onResponseFn?: string
  ): Promise<boolean> {
    if (targetChild) {
      if (!this.fc.getController(targetChild)) {
        const text = `Service ${serviceName} is requested with a target table='${targetChild}', but no table is available with that name. service not requested.`;
        logger.error(text);
        this.showMessages([{ id: 'noTable', text, type: 'error' }]);
        return false;
      }
    }

    const reqAt = new Date().getTime();
    const resp = await this.ac.serve(serviceName, data, false); //we are handling disabling ux
    const respAt = new Date().getTime();
    logger.info(
      `Service '${serviceName}' returned after  ${respAt - reqAt}ms`,
      resp
    );

    if (onResponseFn) {
      logger.info(`Function ${onResponseFn} invoked to process the response`);
      const fnd = this.ac.getFn(onResponseFn, 'response');
      const fn = fnd.fn as ResponseFunction;
      fn(this, resp);
    }

    //we have to show messages
    if (resp.messages) {
      this.showMessages(resp.messages);
    }

    const ok = resp.status === 'completed';
    if (ok) {
      if (resp.data) {
        fc.receiveData(resp.data as Vo, targetChild);
      }

      const completedAt = new Date().getTime();
      logger.info(
        `It took ${completedAt - respAt}ms to render the data received from the service '${serviceName}' `
      );
    }
    return ok;
  }

  /**
   * IMP: code within this class must call this, and not the public method
   * actions can be chained with onSuccess and inFailure.
   * This may lead to infinite loops.
   * This is designed to detect any such loop and throw error, rather than getting a activeActions-over-flow
   */
  private doAct(
    actionName: string,
    p: ActionParameters,
    action?: Action
  ): void {
    if (!action) {
      action = this.getAction(actionName, p.fc);
    }

    let errorFound: boolean = false;
    const controller = p.fc || this.fc;
    if (!action) {
      addMessage(
        `${actionName} is not defined as an action on this page but is requested by a component.`,
        p.msgs
      );
      errorFound = true;
    } else if (p.activeActions[actionName]) {
      addMessage(
        `Action ${actionName} has onSuccess and/or onFailure that is resulting in a circular relationship.
            This may result in an infinite loop,and hence is not allowed`,
        p.msgs
      );
      errorFound = true;
    }

    if (errorFound || !action) {
      this.actionReturned(undefined, false, p);
      return;
    }

    p.activeActions[actionName] = true;
    const actionType = action.type;
    if (action.toDisableUx) {
      this.ac.disableUx();
    }

    switch (actionType) {
      case 'close':
        //todo: any checks and balances?'
        this.ac.closePage();
        break;

      case 'reset':
        let fc: DataController | undefined = this.fc;
        if (action.panelToReset) {
          fc = this.fc.getController(action.panelToReset);
          if (!fc) {
            logger.error(
              `No panel/table named ${action.panelToReset} or that panel is not associated with a child-form. Reset action aborted`
            );
            break;
          }
        }
        fc.resetData(action.fieldsToReset);
        break;

      case 'display':
        for (const [compName, settings] of Object.entries(
          (action as DisplayAction).displaySettings
        )) {
          this.setDisplayState(compName, settings);
        }
        break;

      case 'function':
        const functionName = (action as FunctionAction).functionName;
        /**
         * is it a dynamic function added at run time for this page?
         */
        const fn = this.functions[functionName];
        if (fn) {
          fn();
          break;
        }

        let params: StringMap<any> | undefined;
        if (action.additionalParams) {
          if (p.additionalParams) {
            params = { ...p.additionalParams, ...action.additionalParams };
          } else {
            params = action.additionalParams;
          }
        } else if (p.additionalParams) {
          params = p.additionalParams;
        }
        const status = this.callFunction(
          functionName,
          params,
          p.msgs,
          controller
        );
        errorFound = !status.allOk;
        break;

      case 'form':
        //request the form action as an async, chain the call back, and return.
        this.doFormAction(action as FormAction | FilterAction, p, (ok) => {
          this.actionReturned(action, ok, p);
        });
        return;

      case 'navigation':
        errorFound = this.navigate(action as NavigationAction, p) === false;
        break;

      case 'service':
        const a = action as ServiceAction;
        let values: Vo | undefined;
        if (a.submitAll || a.panelToSubmit) {
          let controllerToUse: DataController | undefined;
          if (a.submitAll) {
            controllerToUse = this.fc;
          } else {
            controllerToUse = this.fc.getController(a.panelToSubmit!);
          }
          if (!controllerToUse) {
            throw new Error(
              `Design Error. Action '${a.name}' on page '${this.name}' specifies panelToSubmit='${a.panelToSubmit}' but that form is not used on this page `
            );
          }

          //let us validate the form again
          if (controllerToUse.validate()) {
            values = controllerToUse.getData() as Vo;
          } else {
            addMessage('Please fix the errors on this page', p.msgs);
            errorFound = true;
          }
        } else if (a.fieldsToSubmit) {
          const n = p.msgs.length;
          values = controller.extractData(a.fieldsToSubmit, p.msgs);
          errorFound = n !== p.msgs.length;
        }

        /**
         * do we have an intercept?
         */
        if (!errorFound && a.fnBeforeRequest) {
          const fnd = this.ac.getFn(a.fnBeforeRequest, 'request');
          const fn = fnd.fn as RequestFunction;
          const ok = fn(controller, values, p.msgs);
          errorFound = !ok;
        }
        if (errorFound) {
          break;
        }

        /**
         * ok. ask for the service.
         */

        this.serve(
          a.serviceName,
          controller,
          values,
          a.targetPanelName,
          a.fnAfterResponse
        ).then((ok: boolean) => {
          this.actionReturned(action, ok, p);
        });
        return;

      default:
        addMessage(
          `${actionType} is an invalid action-type specified in action ${actionName}`,
          p.msgs
        );
        action = undefined; //so that we stop this chain..
        errorFound = true;
        break;
    }

    this.actionReturned(action, !errorFound, p);
  }

  /**
   *
   * @param name may be of the form ${run-time-name}
   */
  private getAction(name: string, fc?: FormController): Action | undefined {
    if (!name.startsWith('$')) {
      return this.actions[name];
    }
    let an = substituteValue(name, this.fc);
    if (an === undefined && fc && this.fc !== fc) {
      an = substituteValue(name, fc);
    }
    if (an === undefined) {
      logger.error(
        `Action '${name}' could not be translated because a value for that field was not found`
      );
      return undefined;
    }
    return this.actions['' + an];
  }

  setDisplayState(compName: string, settings: Values): void {
    this.fc.setDisplayState(compName, settings);
  }

  /**
   * an async action has returned. We have to continue the possible action-chain
   * @param action
   * @param ok //if the action succeeded
   * @param activeActions
   */
  private actionReturned(
    action: Action | undefined,
    ok: boolean,
    p: ActionParameters
  ): void {
    this.showMessages(p.msgs);
    if (!action) {
      return;
    }
    if (action.toDisableUx) {
      this.ac.enableUx();
    }
    //call back action??
    if (ok) {
      if (action.successMessageId) {
        this.showMessages([this.toMessage(action.successMessageId, 'success')]);
      }
      if (action.onSuccess) {
        //this chain continues..
        this.doAct(action.onSuccess, p);
      }
    } else {
      if (action.failureMessageId) {
        this.showMessages([this.toMessage(action.failureMessageId, 'error')]);
      }
      if (action.onFailure) {
        //this chain continues..
        this.doAct(action.onFailure, p);
      }
    }
  }

  toMessage(
    id: string,
    type: 'error' | 'warning' | 'info' | 'success'
  ): DetailedMessage {
    return { id, type, text: this.ac.getMessage(id) };
  }

  private navigate(action: NavigationAction, p: ActionParameters): boolean {
    //NavigationOptions is a subset of NavigationAction
    let navOptions = action as NavigationOptions;
    if (action.pageParameters) {
      const values: Values = {};
      for (const [name, value] of Object.entries(action.pageParameters)) {
        if (typeof value === 'string') {
          const v = substituteValue(value, p.fc || this.fc);
          if (v !== undefined) {
            values[name] = v;
          }
        } else {
          values[name] = value;
        }
      }
      navOptions.pageParameters = values;
    }

    if (action.retainCurrentPage) {
      if (!action.menuItem) {
        addMessage(
          `Action ${action.name} requires that the current page be retained,
            but does not specify the menu item to be used to open a new page`,
          p.msgs
        );
        return false;
      }

      if (action.module) {
        addMessage(
          `Action ${action.name} requires that the current page be retained.
            It should not specify moduleName in this case.`,
          p.msgs
        );
        return false;
      }
      this.ac.navigate(navOptions);
      return true;
    }
    /**
     * we are to close this page
     */
    if (action.warnIfModified && this.isModified) {
      /**
       * TODO: use message service for this
       */
      if (
        window.confirm(
          'Click on Okay to abandon any changes you would have made. Cancel to get back to editing '
        )
      ) {
        return true;
      }
    }

    const closeAction = this.page.onCloseAction;
    if (!closeAction) {
      this.ac.navigate(navOptions);
      return true;
    }

    const tr = this.actions[closeAction];
    if (!tr || tr.type === 'navigation') {
      addMessage(
        `${closeAction} is specified as close-action for this page.
          This action is not defined, or it is defined as a navigation action.`,
        p.msgs
      );
      return false;
    }

    this.act(closeAction, undefined);

    window.setTimeout(() => {
      this.ac.navigate(navOptions);
    }, 0);
    return true;
  }

  private doFormAction(
    action: FormAction | FilterAction,
    actionParams: ActionParameters,
    callback: (ok: boolean) => void
  ): void {
    const fc = actionParams.fc || this.fc;
    const messages: DetailedMessage[] = [];

    let operation = action.formOperation;
    if (operation === 'save') {
      if (!this.forSave) {
        addMessage('This page is not designed for a save operation', messages);
      } else {
        operation = this.saveIsUpdate ? 'update' : 'create';
      }
    }

    const serviceName = this.getServiceName(
      action.formName || fc.getFormName(),
      action.formOperation,
      messages
    );

    if (messages.length) {
      this.showMessages(messages);
      callback(false);
      return;
    }

    let data: Vo | undefined;
    let targetChild: string | undefined;
    switch (action.formOperation) {
      case 'get':
        data = fc.extractKeys(messages) as Vo;
        break;

      case 'filter':
        const fa = action as FilterAction;

        data = this.getFilterData(fc, fa, messages);
        targetChild = fa.targetTableName;
        break;

      case 'create':
      case 'update':
      case 'delete':
      case 'save':
        if (!this.isValid()) {
          addMessage('Page has fields with errors.', messages);
          break;
        }
        data = fc.getData();
        break;

      default:
        addMessage(
          `Form operation ${(action as any).formOperation} is not valid`,
          actionParams.msgs
        );
        callback(false);
        return;
    }
    if (messages.length) {
      this.showMessages(messages);
      callback(false);
      return;
    }

    this.serve(serviceName, fc, data, targetChild, undefined).then((ok) => {
      if (callback) {
        callback(ok);
      }
    });
  }

  private getFilterData(
    fc: FormController,
    action: FilterAction,
    messages: DetailedMessage[]
  ): Vo {
    const vo: Vo = {};
    if (action.sortBy) {
      vo.sorts = action.sortBy;
    }

    if (action.fields) {
      vo.fields = action.fields;
    }

    if (action.maxRows) {
      vo.maxRows = action.maxRows;
    }

    let filters: FilterCondition[] | undefined;
    if (action.filters) {
      filters = getConditions(fc, action.filters, messages);
    } else {
      // any value in the form is considered to be a filter-condition of type '='
      filters = toFilters(fc.getData() as Values);
    }

    if (filters) {
      vo.filters = filters;
    }

    return vo;
  }

  /*  ********** methods discontinued 
  requestGet(
    controller: FormController,
    params?: StringMap<boolean>,
    callback?: (allOK: boolean) => void
  ): void {
    const msgs: DetailedMessage[] = [];
    let data: Vo | undefined;
    let serviceName = this.getServiceName(
      controller.getFormName(),
      'get',
      msgs
    );

    if (serviceName && params) {
      data = controller.extractData(params, msgs);
    }

    if (msgs.length) {
      this.showMessages(msgs);
      if (callback) {
        callback(false);
      }
      return;
    }

    this.serve(serviceName, controller, data).then((ok) => {
      if (callback) {
        callback(ok);
      }
    });
  }

  requestSave(
    saveOperation: 'update' | 'create' | 'delete' | 'save',
    controller: FormController,
    callback?: (allOK: boolean) => void
  ): void {
    const msgs: DetailedMessage[] = [];
    const serviceName = this.getServiceName(
      controller.getFormName(),
      saveOperation,
      msgs
    );
    if (serviceName) {
      if (this.isValid() === false) {
        addMessage('Page has fields with errors.', msgs);
      }

      if (saveOperation === 'save') {
        if (!this.forSave) {
          addMessage('This page is not designed for a save operation', msgs);
        } else {
          saveOperation = this.saveIsUpdate ? 'update' : 'create';
        }
      }
    }

    if (msgs.length) {
      this.showMessages(msgs);
      if (callback) {
        callback(false);
      }
      return;
    }

    const data = controller.getData();
    this.serve(serviceName, controller, data).then((ok) => {
      if (callback) {
        callback(ok);
      }
    });
  }

*************************/
}

/**
 * //TODO we have to validate the fields
 * @param values
 * @returns
 */
function toFilters(values: Values): FilterCondition[] | undefined {
  const filters: FilterCondition[] = [];
  for (const [field, value] of Object.entries(values)) {
    if (value) {
      filters.push({ field, value: '' + value, comparator: '=' });
    }
  }

  if (filters.length) {
    return filters;
  }
  return undefined;
}

function addMessage(text: string, msgs: DetailedMessage[]) {
  msgs.push({ text, id: '', type: 'error' });
}

function getConditions(
  fc: FormController,
  conditions: FilterCondition[],
  msgs: DetailedMessage[]
): FilterCondition[] | undefined {
  const filters: FilterCondition[] = [];
  if (!conditions || !conditions.length) {
    return filters;
  }

  for (const con of conditions) {
    const op = con.comparator || '=';
    if (op === '!#' || op === '#') {
      filters.push(con);
      continue;
    }

    const value = getFilterValue(con.field, con.value, fc);
    if (value === '') {
      if (!con.isRequired) {
        continue;
      }
      addMessage(
        `value is missing for the field '${con.field}'. Action will abort.`,
        msgs
      );
      return undefined;
    }

    if (con.comparator !== '><') {
      filters.push({ ...con, value });
      continue;
    }

    let toValue = con.toValue;

    if (typeof toValue === 'string') {
      toValue = substituteValue(toValue, fc);
    }
    if (toValue !== '') {
      filters.push({ ...con, value, toValue });
      continue;
    }

    if (!con.isRequired) {
      continue;
    }

    addMessage(
      `value is missing for the field '${con.field}'. Action will abort.`,
      msgs
    );
    return undefined;
  }
  return filters;
}

/**
 * get the value for the filter-field.
 * if the supplied value is undefined, it means that the value must be taken from fc.
 * If it is of the form ${fieldName}, it means that the value must be taken for this field-name
 * otherwise the value is taken as it is.
 * @param fieldName name of the field on which the condition is to be put for filtering
 * @param value as specified at design time.
 * @param fc: form controller that has values for the relevant fields
 * @returns
 */
function getFilterValue(
  fieldName: string | undefined,
  value: Value | undefined,
  fc: FormController
): Value {
  let nameToUse = fieldName;

  // Is the value specified at design time?
  if (value !== undefined) {
    if (typeof value !== 'string' || !FIELD_REGEX.test(value)) {
      //it's a constant
      return value;
    }

    //it is a run-time field-name of the form ${field-name}
    nameToUse = value.substring(2, value.length);
  }
  if (!nameToUse) {
    return '';
  }
  const fieldValue = fc.getFieldValue(nameToUse);
  if (fieldValue !== undefined) {
    return fieldValue;
  }

  logger.warn(
    `Parameter ${fieldName} has no value while invoking an action that uses this parameter`
  );
  return '';
}

/**
 * If the value is of the pattern ${fieldName}, get the value of that field-name.
 * else return the value as it is
 * @param value as specified at design time.
 * @param fc: form controller that has values for the relevant fields
 * @returns
 */
function substituteValue(value: string, fc: FormController): Value | undefined {
  if (!FIELD_REGEX.test(value)) {
    return value;
  }

  const name = value.substring(2, value.length - 1);

  const val = fc.getFieldValue(name);
  if (val === undefined) {
    logger.warn(
      `${value}: No value found for run-time-field ${name} in the form-controller`
    );
  }

  return val;
}
