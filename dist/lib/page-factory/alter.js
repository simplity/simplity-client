"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alterPage = alterPage;
const logger_1 = require("../logger-stub/logger");
const logger = logger_1.loggerStub.getLogger();
/**
 * attributes that we copy/override : simple ones
 */
const simpleAttributes = [
    'formName',
    'isEditable',
    'titlePrefix',
    'titleField',
    'titleSuffix',
    'hideMenu',
    'hideModules',
    'inputIsForUpdate',
    'serveGuests',
    'onCloseAction',
];
/**
 * attributes that are maps that we copy/override
 */
const mapAttributes = [
    'actions',
    'inputs',
];
/**
 * attributes that are array that we copy/override
 */
const arrAttributes = [
    'onLoadActions',
    'triggers',
    'leftButtons',
    'middleButtons',
    'rightButtons',
];
/**
 * alter a page as per alteration specifications
 * @param pageToAlter received as any to avoid the compile time error with readonly check
 * @param alterations
 */
function alterPage(page, alts) {
    logger.info(`page ${page.name} is going to be altered`);
    //step-1: copy simple attributes
    for (const attr of simpleAttributes) {
        const val = alts[attr];
        if (val !== undefined) {
            //@ts-expect-error  we are certainly copying the right value. How do we tell this to lint?
            page[attr] = val;
            logger.info(`page.${attr} changed to ${val}`);
        }
    }
    // step-2: add/replace (and NOT merge) maps. No feature to remove an entry
    for (const attr of mapAttributes) {
        const src = alts[attr];
        if (src == undefined) {
            continue;
        }
        logger.info(`objects will be added/replaced for page[${attr}] `);
        let target = page[attr];
        if (!target) {
            target = {};
            page[attr] = target;
        }
        for (const [name, obj] of Object.entries(src)) {
            target[name] = copyOf(obj);
        }
    }
    // step-3: append arrays. no feature to remove an entry
    for (const attr of arrAttributes) {
        const src = alts[attr];
        if (src === undefined) {
            continue;
        }
        logger.info(`values will be appended to page[${attr}] `);
        let target = page[attr];
        if (target === undefined) {
            target = [];
            //@ts-expect-error generic code
            page[attr] = target;
        }
        for (const a of src) {
            logger.info(`${a} appended`);
            target.push(a);
        }
    }
    /**
     * alteration to the component tree
     */
    const childComps = page.dataPanel?.children;
    if (!childComps) {
        logger.info(`Page has no components inside it dataPanel. No alterations processed for child components`);
        return;
    }
    /**
     * nbr of alterations are small compared to the total number of child-nodes under a panel.
     * Hence we keep track of number of tasks to stop going down the tree once we are done.
     */
    let nbrTasks = 0;
    const adds = alts.additions;
    if (adds) {
        nbrTasks += Object.keys(adds).length;
    }
    const updates = alts.changes;
    if (updates) {
        nbrTasks += Object.keys(updates).length;
    }
    //step-6: deletions
    let deletes = alts.deletions;
    if (deletes) {
        nbrTasks += Object.keys(deletes).length;
    }
    if (nbrTasks > 0) {
        alterChildren(page.dataPanel, alts, nbrTasks);
    }
}
function alterChildren(parent, alts, nbrTasks) {
    const parentName = parent.name;
    const comps = [];
    for (const child of parent.children) {
        if (nbrTasks < 1) {
            comps.push(child);
            continue;
        }
        const childName = child.name;
        const toDelete = alts.deletions ? alts.deletions[childName] : false;
        const anUpdate = alts.changes && alts.changes[childName];
        if (toDelete) {
            if (anUpdate) {
                logger.warn(`Element ${parentName} specifies that its child element ${childName} be altered, but it also specifies that it should be deleted. deletion command ignored.`);
                nbrTasks--;
            }
            else {
                logger.info(`Child element ${childName} deleted`);
                nbrTasks--;
                continue;
            }
        }
        if (anUpdate) {
            for (const [attName, value] of Object.entries(anUpdate)) {
                //@ts-ignore  this is a generic code for type-safety is traded-off
                child[attName] = value;
                logger.info(`${childName}.${attName} got modified`);
            }
            nbrTasks--;
        }
        const anAdd = alts.additions && alts.additions[childName];
        const compsToAdd = anAdd && anAdd.comps;
        const nbrToAdd = compsToAdd && compsToAdd.length;
        let alreadyPushed = false;
        if (nbrToAdd) {
            const toInsert = anAdd.insertBefore;
            console.info(`Going to add components ${toInsert ? 'before' : 'after'} ${childName} `);
            if (!toInsert) {
                comps.push(child);
                alreadyPushed = true;
            }
            for (const c of compsToAdd) {
                comps.push(c);
                console.info(`${c.name} added`);
            }
            nbrTasks--;
        }
        if (!alreadyPushed) {
            comps.push(child);
        }
        /**
         * is this child a container?
         * in which case we have to look for alterations of its chidren, recursively
         */
        if (child.children) {
            nbrTasks = alterChildren(child, alts, nbrTasks);
        }
    }
    parent.children = comps;
    return nbrTasks;
}
function copyOf(field) {
    const obj = {};
    for (const [name, value] of Object.entries(field)) {
        obj[name] = value;
    }
    return obj;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWx0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL3BhZ2UtZmFjdG9yeS9hbHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQWdEQSw4QkF1RkM7QUFoSUQsa0RBQW1EO0FBRW5ELE1BQU0sTUFBTSxHQUFHLG1CQUFVLENBQUMsU0FBUyxFQUFFLENBQUM7QUFDdEM7O0dBRUc7QUFDSCxNQUFNLGdCQUFnQixHQUEwQztJQUM5RCxVQUFVO0lBQ1YsWUFBWTtJQUNaLGFBQWE7SUFDYixZQUFZO0lBQ1osYUFBYTtJQUNiLFVBQVU7SUFDVixhQUFhO0lBQ2Isa0JBQWtCO0lBQ2xCLGFBQWE7SUFDYixlQUFlO0NBQ2hCLENBQUM7QUFDRjs7R0FFRztBQUNILE1BQU0sYUFBYSxHQUEwQztJQUMzRCxTQUFTO0lBQ1QsUUFBUTtDQUNULENBQUM7QUFDRjs7R0FFRztBQUNILE1BQU0sYUFBYSxHQUEwQztJQUMzRCxlQUFlO0lBQ2YsVUFBVTtJQUNWLGFBQWE7SUFDYixlQUFlO0lBQ2YsY0FBYztDQUNmLENBQUM7QUFFRjs7OztHQUlHO0FBQ0gsU0FBZ0IsU0FBUyxDQUFDLElBQVUsRUFBRSxJQUFvQjtJQUN4RCxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDLElBQUkseUJBQXlCLENBQUMsQ0FBQztJQUV4RCxnQ0FBZ0M7SUFDaEMsS0FBSyxNQUFNLElBQUksSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO1FBQ3BDLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2QixJQUFJLEdBQUcsS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUN0QiwwRkFBMEY7WUFDMUYsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQztZQUNqQixNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxlQUFlLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDaEQsQ0FBQztJQUNILENBQUM7SUFFRCwwRUFB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