import { SimpleList, ValueType } from '..';
/**
 * Record is an ordered set of data elements
 * It is a server-side concept. However, it is used to generate forms that are used by the client-sde-apps
 */
export type Record = SimpleRecord | ExtendedRecord | CompositeRecord;
/**
 * type of a field in a record
 */
export type FieldType = 'generatedPrimaryKey' | 'primaryKey' | 'tenantKey' | 'createdBy' | 'createdAt' | 'modifiedBy' | 'modifiedAt' | 'requiredData' | 'optionalData';
type InterFieldValidationType = 
/**
 * either both fields have values or both are empty
 */
'bothOrNone'
/**
 * if first one has a value, second one also must have a value. If first one has no value, then there is no restriction on the second one.
 */
 | 'bothOrSecond'
/**
 * both must have the same value
 */
 | 'equal'
/**
 * the two must have different values
 */
 | 'different'
/**
 * one and only of the two must have a value
 */
 | 'oneOf'
/**
 * from-to-pair. Field2 must have a value greater than the value of the first one
 */
 | 'range'
/**
 * field2 must have a value greater than or equal to the first one
 */
 | 'rangeOrEqual';
type BaseRecord = {
    /**
     * record names have to be unique, but they may clash with name of other types.
     * for example a form may have the same name as the record that it is based on.
     */
    name: string;
    description: string;
    /**
     * If this record represents a table/view in the RDBMS
     */
    nameInDb?: string;
    /**
     * name of the function that validates an instance of data.
     * this function must follow the prescribed API for such a function, and is made available at run time.
     * This function should be of type FormValidationFunction with scope set to 'form'
     */
    validationFn?: string;
    /**
     * timestamp technique is used to handle issues related to concurrent updates
     */
    useTimestampCheck?: boolean;
    /**
     * used to generate a form
     */
    operations?: FormOperation[];
    /**
     * a form is generated only if this is visible to client-side
     */
    isVisibleToClient: boolean;
    /**
     * if this is visible to the client-app, is authentication required for the client to trigger any form-based service?
     */
    serveGuests?: boolean;
    /**
     * used for generating demo/test data
     */
    nbrDataRowsForDemo?: number;
    /**
     * inter-field validations are invoked only if all the field validations succeed
     */
    interFieldValidations?: InterFieldValidation[];
    /**
     * related records are for documentation purpose as of now.
     */
    relatedRecords?: RelatedRecord[];
};
export type RelatedRecord = {
    /**
     * name of the other field
     */
    name: string;
    /**
     * Relationship of this record with another.
     * We have no included many-to-many because it is generally not useful that way.
     * In most cases, many-to-many is through a third record.
     * For example A->B (many-to-many) means A->C(many-to-one) and B->C(many-to-one)
     */
    type: 'one-to-one' | 'many-to-one' | 'one-to-many';
    /**
     * field name from this record, field name from the relatedRecord
     */
    matchedFields: [string, string];
};
export type SimpleRecord = BaseRecord & {
    recordType: 'simple';
    /**
     * fields that make up this record.
     * in certain contexts, the order is important Hence this is an array
     */
    fields: Field[];
};
/**
 * a record that hs fields from another record and possibly some more fields
 */
export type ExtendedRecord = BaseRecord & {
    recordType: 'extended';
    /**
     * main record from which this sub-record is defined
     */
    mainRecordName: string;
    /**
     * All fields from thee main record are included by default.
     * Specify the subset of field names to be included if only a subset of fields are to be included
     */
    fieldNames?: string[];
    /**
     * any additional fields
     */
    additionalFields?: Field[];
};
export type CompositeRecord = BaseRecord & {
    recordType: 'composite';
    /**
     * main record to which the other (child) records are linked to
     */
    mainRecordName: string;
    childRecords: ChildRecord[];
};
export type Field = {
    /**
     * name is to be unique within a record
     */
    name: string;
    /**
     * this is from a data-base design perspective, if this is a column in the table.
     * otherwise, only optional/required
     */
    fieldType: FieldType;
    /**
     * value type 'boolean' 'text' 'integer' etc..
     */
    valueType: ValueType;
    /**
     * how to validate the value of this field?
     * optional for fields that are not coming from an external source.
     * however, it also serves as a good documentation about the expected range of values.
     * hence it is highly recommended that this is specified.
     */
    valueSchema?: string;
    /**
     * required if this is a column in the RDBMS table
     */
    nameInDb?: string;
    /**
     * what should be the type of column in the dbDesign.
     * defaults to the type determined based on the dbTypes specified at the app-level
     */
    dbType?: string;
    /**
     * if this field is a drop-down.
     * to be used only if the list is simple, and is not a common one across several other fields.
     * also useful if the field is synthesized at run time.
     */
    listOptions?: SimpleList;
    /**
     * if the value is one of a list of enumerated values..
     * like if the field is country-code, then it may be associated with a pre-defined list named 'countries'
     */
    listName?: string;
    /**
     * if the list of values is a keyed-list and the key value is to be taken from another field.
     * Like state-code that would depend on 'country-code'
     */
    listKeyFieldName?: string;
    /**
     * in case the list is keyed, but this field uses a deign-time fixed value for the key.
     * e.g. reportField uses a keyed-list named reportFields, and the current field is mean for a reportName="users"
     * in such a case, listKeyName should not be specified, but listKeyValue="users"
     */
    listKeyValue?: string | number;
    /**
     * relevant if this field is included in a tabular list
     */
    sortable?: boolean;
    /**
     * relevant if this field is included in a tabular list
     */
    filterable?: boolean;
    /**
     * used by the client-side for rendering a tabular list of rows, by default
     */
    showInList?: boolean;
    /**
     * some fields in a record may be managed programmatically, and are not edited by the end-user
     */
    hideInSave?: boolean;
    /**
     * id for the message to be flashed in the client if this field fails validation
     */
    messageId?: string;
    description?: string;
    /**
     * used for validation as well as generating sql script
     */
    isRequired?: boolean;
    /**
     * if specified, it should be a
     */
    defaultValue?: string;
    /**
     * used by the client-side for rendering
     */
    label?: string;
    /**
     * used by the client-side for rendering
     */
    icon?: string;
    /**
     * used by the client-side for rendering
     */
    suffix?: string;
    /**
     * used by the client-side for rendering
     */
    prefix?: string;
    /**
     * used by the client-side for rendering
     */
    placeHolder?: string;
    /**
     * used by the client-side for rendering
     */
    hint?: string;
    /**
     * not recommended, but in some cases the field may contain an array of values.
     * if this is set to true, then it is assumed that the field is actually a text-field and the value must be a comma-separated list of values,each of which conform to the specified value-schema
     */
    isArray?: boolean;
    /**
     * how should this field be rendered in a form/page?
     */
    renderAs?: FieldRendering;
    /**
     * used by the client-side for rendering
     */
    width?: VisualWidth;
    /**
     * expression that determine how values for this field are generated across rows for demo/tst purposes
     */
    demoValue?: string;
    /** any custom action to be taken on change of this field. If specified, this action must be defined in the page.ts */
    onChange?: string;
    /**
     * any custom action to be taken while user keeps typing value for this field.
     * If specified, this action must be defined in the page.ts
     */
    onBeingChanged?: string;
    /**
     * text field may be for a password
     */
    isPassword?: true;
    /** for image field */
    imageNamePrefix?: string;
    /** for image fields */
    imageNameSuffix?: string;
};
/**
 * validate a pair-of related fields
 */
export type InterFieldValidation = {
    field1: string;
    field2: string;
    validationType: InterFieldValidationType;
    messageId: string;
    /**
     * the rule is applicable if and only if field1 has this specific value
     */
    onlyIfFieldValueEquals?: 'string';
};
/**
 * ways to render a field(data-bound control) in a page/form
 */
export type FieldRendering = 'hidden' | 'output' | 'image' | 'text-field' | 'text-area' | 'password' | 'select' | 'select-output' | 'check-box' | 'custom';
/**
 * operations on a record/form/data-set. Traditionally called CRUD for Create, Read, Update,Delete
 */
export type FormOperation = 'get' | 'create' | 'update' | 'delete' | 'filter' | 'save';
/**
 * Visual width of a component being rendered
 */
export type VisualWidth = 'quiteNarrow' | 'narrow' | 'normal' | 'wide' | 'quiteWide' | 'entireRow';
/**
 * A child form is linked to a parent form in a data-structure
 */
export type ChildRecord = SimpleChildRecord | EditableChildRecord | TabularChildRecord | EditableTabularChildRecord;
type BaseChild = {
    linkName: string;
    childRecordName: string;
    parentLinkFields: string[];
    childLinkFields: string[];
    label?: string;
};
export type SimpleChildRecord = BaseChild & {
    childType: 'simple';
};
export type EditableChildRecord = BaseChild & {
    childType: 'editable';
    isEditable: true;
    errorId: string;
};
export type TabularChildRecord = BaseChild & {
    childType: 'table';
    isTable: true;
};
export type EditableTabularChildRecord = BaseChild & {
    childType: 'editableTable';
    isEditable: true;
    isTable: true;
    minRows: number;
    maxRows: number;
    errorId: string;
};
export {};
