"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pageFactory = void 0;
const alter_1 = require("./alter");
const generate_1 = require("./generate");
exports.pageFactory = {
    /**
     * generate one or more pages and adds them to the simplity-based page component
     * @param template
     * @param form to be used for adding fields to the template
     * @param pages generated pages are added this collection/object
     * @returns number of pages generated. 0 in case of any error.
     */
    generatePage: generate_1.generatePage,
    /**
     * alter a page as per alteration specifications
     * @param pageToAlter received as any to avoid the compile time error with readonly check
     * @param alterations
     */
    alterPage: alter_1.alterPage,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFnZUZhY3RvcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL3BhZ2UtZmFjdG9yeS9wYWdlRmFjdG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBb0M7QUFDcEMseUNBQTBDO0FBRTdCLFFBQUEsV0FBVyxHQUFHO0lBQ3pCOzs7Ozs7T0FNRztJQUNILFlBQVksRUFBWix1QkFBWTtJQUVaOzs7O09BSUc7SUFDSCxTQUFTLEVBQVQsaUJBQVM7Q0FDVixDQUFDIn0=