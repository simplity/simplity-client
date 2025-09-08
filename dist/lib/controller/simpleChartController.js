"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleChartController = void 0;
class SimpleChartController {
    constructor(fc, view) {
        this.fc = fc;
        this.view = view;
        this.data = [];
        this.type = 'chart';
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
    isModified() {
        return false;
    }
    isValid() {
        return true;
    }
    validate() {
        return true;
    }
    resetData(fields) {
        this.setData([]);
    }
}
exports.SimpleChartController = SimpleChartController;
//# sourceMappingURL=simpleChartController.js.map