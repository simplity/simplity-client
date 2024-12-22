import { DataField, FormOperation, InterFieldValidation, StringMap } from '..';
/**
 * form has the meta data for the data model.
 * A page generally uses a form to create form-data as its run-time data
 */
export type Form = {
    name: string;
    operations?: ValidFormOperations;
    serveGuests?: boolean;
    fields: StringMap<DataField>;
    keyFields?: string[];
    /**
     * field names array, just in case the order of fields is required
     */
    fieldNames: string[];
    /**
     * form level validation function that is triggered after all fields are validated with success
     */
    validationFn?: string;
    interFieldValidations?: InterFieldValidation[];
    childForms?: StringMap<ChildForm>;
};
/**
 * hierarchical data within a page.
 */
export type ChildForm = {
    name: string;
    formName: string;
    isTable?: boolean;
    isEditable?: boolean;
    label?: string;
    minRows?: number;
    maxRows?: number;
    errorId?: string;
};
export type ValidFormOperations = {
    [key in FormOperation]?: boolean;
};
