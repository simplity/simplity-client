"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseElement = void 0;
const logger_1 = require("../logger-stub/logger");
const app_1 = require("../controller/app");
const htmlUtil_1 = require("./htmlUtil");
/**
 * Base class to be extended by all view components
 * As of now, it is NOT a WebComponent, but a controller that is bound to the root html element.
 * By making this the base class, we have kept the flexibility to refactor them to webComponents later
 * (This approach is similar to Material Design Components of Google.)
 *
 * click event is handled here, while change and changing is handled by the fieldElement
 */
class BaseElement {
    /**
     *
     * @param table meta data for this view component
     * @param templateName to be used to create the HTML element. ignored if root is provided
     * @param template instance to be cloned as HTML element
     */
    constructor(fc, table, templateName) {
        this.fc = fc;
        this.table = table;
        this.logger = logger_1.loggerStub.getLogger();
        this.name = table.name;
        if (fc) {
            this.pc = fc.pc;
            this.ac = this.pc.ac;
        }
        else {
            this.ac = app_1.app.getCurrentAc();
            this.pc = app_1.app.getCurrentPc();
        }
        this.root = htmlUtil_1.htmlUtil.newHtmlElement(this.table.customHtml || 'template' + '-' + templateName);
        if (fc) {
            fc.registerChild(this);
            this.root.addEventListener('click', () => {
                this.clicked();
            });
        }
        /**
         *
         * we will handle input control specific aspects in the base element itself
         */
        this.inputEle = this.root.querySelector('input') || undefined;
        if (table.label) {
            this.labelEle = htmlUtil_1.htmlUtil.getOptionalElement(this.root, 'label');
            if (this.labelEle) {
                this.labelEle.innerText = table.label;
            }
            else {
                this.logger.info(`node ${table.name} has a label value of "${table.label}" bot the html has no element with data-id="label"`);
            }
        }
    }
    /**
     * concrete classes should implement this if error is relevant
     * @param msg
     */
    setError(msg) {
        this.logger.warn(`component type ${this.table.compType} has not implemented setError(), but a request is received with value="${msg}"`);
        this.setDataAttr('error', msg === undefined ? undefined : '' + msg);
    }
    setDisplay(settings) {
        for (const [setting, value] of Object.entries(settings)) {
            switch (setting) {
                case 'error':
                    this.setError(value);
                    return;
                case 'disabled':
                    if (this.inputEle) {
                        this.inputEle.disabled = !!value;
                        return;
                    }
                    this.setDataAttr('disabled', value);
                    return;
                case 'hidden':
                default:
                    this.setDataAttr(setting, value);
            }
        }
    }
    clicked() {
        const action = this.table.onClick;
        if (action) {
            if (this.fc) {
                this.fc.act(action);
            }
            else {
                this.pc.act(action);
            }
        }
        /**
         * there could be listeners..
         */
        if (this.fc) {
            this.fc.eventOccurred({
                eventName: 'click',
                viewName: this.name,
                view: this,
                fc: this.fc,
            });
        }
    }
    /**
     *
     * @param attr name of the attribute, (without the data-prefix)
     * @param value undefined to remove the attribute. String, including empty string, to set the value
     * @returns
     */
    setDataAttr(attr, value) {
        const att = 'data-' + attr;
        if (value === undefined) {
            this.root.removeAttribute(att);
            return;
        }
        this.root.setAttribute(att, value);
    }
}
exports.BaseElement = BaseElement;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZUVsZW1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2h0bWwvYmFzZUVsZW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsa0RBQW1EO0FBQ25ELDJDQUF3QztBQUN4Qyx5Q0FBc0M7QUFXdEM7Ozs7Ozs7R0FPRztBQUNILE1BQWEsV0FBVztJQVl0Qjs7Ozs7T0FLRztJQUNILFlBQ2tCLEVBQThCLEVBQzlCLEtBQW9CLEVBQ3BDLFlBQXFCO1FBRkwsT0FBRSxHQUFGLEVBQUUsQ0FBNEI7UUFDOUIsVUFBSyxHQUFMLEtBQUssQ0FBZTtRQW5CbkIsV0FBTSxHQUFHLG1CQUFVLENBQUMsU0FBUyxFQUFFLENBQUM7UUFzQmpELElBQUksQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztRQUN2QixJQUFJLEVBQUUsRUFBRSxDQUFDO1lBQ1AsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDO1lBQ2hCLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7UUFDdkIsQ0FBQzthQUFNLENBQUM7WUFDTixJQUFJLENBQUMsRUFBRSxHQUFHLFNBQUcsQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUM3QixJQUFJLENBQUMsRUFBRSxHQUFHLFNBQUcsQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUMvQixDQUFDO1FBQ0QsSUFBSSxDQUFDLElBQUksR0FBRyxtQkFBUSxDQUFDLGNBQWMsQ0FDakMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLElBQUksVUFBVSxHQUFHLEdBQUcsR0FBRyxZQUFZLENBQ3pELENBQUM7UUFDRixJQUFJLEVBQUUsRUFBRSxDQUFDO1lBQ1AsRUFBRSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN2QixJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUU7Z0JBQ3ZDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNqQixDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFDRDs7O1dBR0c7UUFDSCxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxJQUFJLFNBQVMsQ0FBQztRQUU5RCxJQUFJLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNoQixJQUFJLENBQUMsUUFBUSxHQUFHLG1CQUFRLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNoRSxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDbEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQztZQUN4QyxDQUFDO2lCQUFNLENBQUM7Z0JBQ04sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQ2QsUUFBUSxLQUFLLENBQUMsSUFBSSwwQkFBMEIsS0FBSyxDQUFDLEtBQUssb0RBQW9ELENBQzVHLENBQUM7WUFDSixDQUFDO1FBQ0gsQ0FBQztJQUNILENBQUM7SUFFRDs7O09BR0c7SUFDTyxRQUFRLENBQUMsR0FBWTtRQUM3QixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FDZCxrQkFBa0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLDBFQUEwRSxHQUFHLEdBQUcsQ0FDdEgsQ0FBQztRQUNGLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLEdBQUcsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFDO0lBQ3RFLENBQUM7SUFFRCxVQUFVLENBQUMsUUFBeUI7UUFDbEMsS0FBSyxNQUFNLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztZQUN4RCxRQUFRLE9BQXdDLEVBQUUsQ0FBQztnQkFDakQsS0FBSyxPQUFPO29CQUNWLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ3JCLE9BQU87Z0JBRVQsS0FBSyxVQUFVO29CQUNiLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO3dCQUNsQixJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDO3dCQUNqQyxPQUFPO29CQUNULENBQUM7b0JBQ0QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBQ3BDLE9BQU87Z0JBRVQsS0FBSyxRQUFRLENBQUM7Z0JBQ2Q7b0JBQ0UsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDckMsQ0FBQztRQUNILENBQUM7SUFDSCxDQUFDO0lBRUQsT0FBTztRQUNMLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDO1FBQ2xDLElBQUksTUFBTSxFQUFFLENBQUM7WUFDWCxJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDWixJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN0QixDQUFDO2lCQUFNLENBQUM7Z0JBQ04sSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDdEIsQ0FBQztRQUNILENBQUM7UUFDRDs7V0FFRztRQUNILElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ1osSUFBSSxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUM7Z0JBQ3BCLFNBQVMsRUFBRSxPQUFPO2dCQUNsQixRQUFRLEVBQUUsSUFBSSxDQUFDLElBQUk7Z0JBQ25CLElBQUksRUFBRSxJQUFJO2dCQUNWLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRTthQUNaLENBQUMsQ0FBQztRQUNMLENBQUM7SUFDSCxDQUFDO0lBQ0Q7Ozs7O09BS0c7SUFDTyxXQUFXLENBQUMsSUFBWSxFQUFFLEtBQXlCO1FBQzNELE1BQU0sR0FBRyxHQUFHLE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDM0IsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDL0IsT0FBTztRQUNULENBQUM7UUFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDckMsQ0FBQztDQUNGO0FBOUhELGtDQThIQyJ9