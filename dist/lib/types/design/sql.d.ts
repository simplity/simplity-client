import { ValueType } from '..';
export type ReadSql = {
    name: string;
    description: string;
    sqlType: 'readOne' | 'readMany';
    /**
     * sql MUST start with the WHERE (case insensitive) verb.
     * The SELECT part of the SQL will be generated based on the output fields or output record
     */
    sql: string;
    /**
     * name of the table/view in the database from which to read data rows
     */
    readFrom: string;
} & ({
    inputFields: InputField[];
} | {
    inputRecord: string;
} | {}) & ({
    outputFields: OutputField[];
} | {
    outputRecord: string;
});
export type WriteSql = {
    name: string;
    description: string;
    sqlType: 'write';
    /**
     * sql must start with insert/update/delete
     */
    sql?: string;
} & ({
    inputFields: InputField[];
} | {
    inputRecord: string;
} | {});
export type StoredProcedure = {
    name: string;
    description: string;
    sqlType: 'call';
    procedureName: string;
    returnType?: ValueType;
} & ({
    inputFields: InputField[];
} | {
    inputRecord: string;
} | {}) & ({
    outputFields: OutputField[];
} | {
    outputRecord: string;
} | {
    resultRecords: (string | undefined)[];
} | {});
export type Sql = ReadSql | WriteSql | StoredProcedure;
/**
 * Input parameter for a SQL
 */
export type InputField = {
    /**
     * name is to be unique within a record
     */
    name: string;
    valueType: ValueType;
    /**
     * used for validation as well as generating sql script
     */
    isRequired?: boolean;
    /**
     * if specified, it should be a
     */
    defaultValue?: string;
    /**
     * if additional validations are required
     */
    valueSchema?: string;
};
/**
 * Output field from a select/read statement
 */
export type OutputField = {
    name: string;
    nameInDb: string;
    valueType: ValueType;
};
