export class CC {
    fc;
    view;
    data = [];
    name;
    type = 'chart';
    pc;
    chart;
    constructor(fc, view) {
        this.fc = fc;
        this.view = view;
        this.name = view.name;
        this.pc = fc.pc;
        this.chart = view.chart;
    }
    setDisplayState(compName, settings) {
        console.error(`Chart Component '${this.name}' : setDisplayState() for a sub-component named ${compName} is ignored`);
        return false;
    }
    getFormName() {
        return undefined;
    }
    receiveData(data, _childName) {
        this.setData(data);
    }
    setData(data) {
        if (Array.isArray(data)) {
            this.data = data;
            this.view.renderData(data);
            return;
        }
        console.error(`Chart Component ${this.name}: Non-array data is received. Data Ignored`, data);
    }
    getData() {
        return this.data;
    }
    isValid() {
        return true;
    }
    validate() {
        return true;
    }
}
//# sourceMappingURL=chartController.js.map