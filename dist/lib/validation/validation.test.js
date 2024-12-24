"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testSets = void 0;
const validation_1 = require("./validation");
const globals_1 = require("@jest/globals");
let b = '';
for (let i = 0; i < validation_1.DEFAULT_MAX_CHARS; i++) {
    b += 'a';
}
const LONG_STR = b;
const LONG_STR_PLUS_ONE = b + '1';
//dates can not be hard-coded for testing. They are relative to now()
const now = new Date();
const nowYear = now.getFullYear();
const nowMon = now.getMonth();
const nowDate = now.getDate();
//get UTC date with this date and 0 time
const today = new Date(Date.UTC(nowYear, nowMon, nowDate, 0, 0, 0, 0));
const todayPlus10 = new Date(Date.UTC(nowYear, nowMon, nowDate + 10, 0, 0, 0, 0));
const todayMinus20 = new Date(Date.UTC(nowYear, nowMon, nowDate - 20, 0, 0, 0, 0));
const maxDate = new Date(Date.UTC(nowYear, nowMon, nowDate + validation_1.DEFAULT_DAYS_RANGE, 0, 0, 0, 0));
const minDate = new Date(Date.UTC(nowYear, nowMon, nowDate - validation_1.DEFAULT_DAYS_RANGE, 0, 0, 0, 0));
const minDateMinus1 = new Date(Date.UTC(nowYear, nowMon, nowDate - validation_1.DEFAULT_DAYS_RANGE - 1));
const maxDatePlus1 = new Date(Date.UTC(nowYear, nowMon, nowDate + validation_1.DEFAULT_DAYS_RANGE + 1));
const NOW = today.toISOString();
const NOW_PLUS_10 = todayPlus10.toISOString();
const NOW_MINUS_20 = todayMinus20.toISOString();
const MAX_TIMESTAMP = maxDate.toISOString();
const MIN_TIMESTAMP = minDate.toISOString();
const MAX_TIMESTAMP_PLUS1 = maxDatePlus1.toISOString();
const MIN_TIMESTAMP_MINUS1 = minDateMinus1.toISOString();
const TODAY = NOW.substring(0, 10);
const TODAY_PLUS_10 = NOW_PLUS_10.substring(0, 10);
const TODAY_MINUS_20 = NOW_MINUS_20.substring(0, 10);
const MAX_DATE = MAX_TIMESTAMP.substring(0, 10);
const MIN_DATE = MIN_TIMESTAMP.substring(0, 10);
const MAX_DATE_PLUS1 = MAX_TIMESTAMP_PLUS1.substring(0, 10);
const MIN_DATE_MINUS1 = MIN_TIMESTAMP_MINUS1.substring(0, 10);
const ZERO_TIME = 'T00:00:00.000Z';
const VALID_TIME = 'T21:34:52.895Z';
//error codes
const TEXT_ERR = '_invalidText';
const NUMBER_ERR = '_invalidNumber';
const BOOL_ERR = '_invalidBoolean';
const DATE_ERR = '_invalidDate';
const STAMP_ERR = '_invalidTimestamp';
const MIN_LEN_ERR = '_minLength';
const MAX_LEN_ERR = '_maxLength';
const MIN_VAL_ERR = '_minValue';
const MAX_VAL_ERROR = '_maxValue';
const EARLY_ERROR = '_earliestDate';
const LATE_ERROR = '_latestDate';
//value Types
const TEXT = 'text';
const INT = 'integer';
const DECIMAL = 'decimal';
const BOOL = 'boolean';
const DATE = 'date';
const STAMP = 'timestamp';
exports.testSets = {
    boolean: [
        {
            description: 'default boolean schema',
            schema: {
                name: 'bool',
                valueType: BOOL,
            },
            notOkTests: [
                {
                    value: -1,
                    errorId: BOOL_ERR,
                },
                {
                    value: 100,
                    errorId: BOOL_ERR,
                },
                {
                    value: 't rue',
                    errorId: BOOL_ERR,
                },
                {
                    value: 'right',
                    errorId: BOOL_ERR,
                },
                {
                    value: 'wrong',
                    errorId: BOOL_ERR,
                },
                {
                    value: 'a long text that is certainly not a boolean',
                    errorId: BOOL_ERR,
                },
                { value: 'ಸುಳ್ಳು', errorId: BOOL_ERR },
                { value: 'ನಿಜ', errorId: BOOL_ERR },
            ],
            okTests: [
                {
                    value: undefined,
                    parsedValue: false,
                },
                {
                    value: NaN,
                    parsedValue: false,
                },
                {
                    value: null,
                    parsedValue: false,
                },
                { value: true },
                { value: false },
                {
                    value: 'true',
                    parsedValue: true,
                },
                {
                    value: 'false',
                    parsedValue: false,
                },
                {
                    value: ' true',
                    parsedValue: true,
                },
                {
                    value: 'true ',
                    parsedValue: true,
                },
                {
                    value: '\t\n false \t  ',
                    parsedValue: false,
                },
                {
                    value: '1',
                    parsedValue: true,
                },
                {
                    value: '0',
                    parsedValue: false,
                },
                {
                    value: 1,
                    parsedValue: true,
                },
                {
                    value: 0,
                    parsedValue: false,
                },
            ],
        },
        {
            description: 'boolean with max/min length. expect the lengths to be ignored',
            schema: {
                valueType: BOOL,
                name: 'name',
                //minLength: 10,
                //maxLength: 100,
            },
            okTests: [
                {
                    value: 1,
                    parsedValue: true,
                },
                {
                    value: 0,
                    parsedValue: false,
                },
            ],
            notOkTests: [],
        },
    ],
    text: [
        {
            description: `default text-type. expect min-length as 0 and max length as ${validation_1.DEFAULT_MAX_CHARS}`,
            schema: {
                name: 'name',
                valueType: TEXT,
            },
            okTests: [
                { value: '' },
                { value: 'a' },
                { value: '!@#$%^&*((()(*^%%GHHHJHBhgtyh' },
                { value: LONG_STR },
                { value: true, parsedValue: 'true' },
                { value: false, parsedValue: 'false' },
                { value: 123, parsedValue: '123' },
                { value: 1.456, parsedValue: '1.456' },
                { value: 0, parsedValue: '0' },
            ],
            notOkTests: [
                {
                    value: LONG_STR_PLUS_ONE,
                    errorId: MAX_LEN_ERR,
                    params: [validation_1.DEFAULT_MAX_CHARS + ''],
                },
            ],
        },
        {
            description: 'min 4 and max 9 characters with no regex',
            schema: {
                name: 'name',
                valueType: TEXT,
                minLength: 4,
                maxLength: 9,
            },
            okTests: [
                { value: 1234, parsedValue: '1234' },
                { value: 12345, parsedValue: '12345' },
                { value: 12345, parsedValue: '12345' },
                { value: 1.23456, parsedValue: '1.23456' },
                { value: '1a3B.$%' },
                { value: 'sev e n' },
                { value: 'a\n\t b', parsedValue: 'a\n\t b' },
                { value: 'ಭಾರತ', parsedValue: 'ಭಾರತ' }, //this unicode results in 5 chars!!
                { value: true, parsedValue: 'true' },
                { value: false, parsedValue: 'false' },
                { value: '   ~!@tyu7  \t ', parsedValue: '~!@tyu7' },
                { value: '   true', parsedValue: 'true' },
            ],
            notOkTests: [
                { value: undefined, errorId: TEXT_ERR },
                { value: NaN, errorId: TEXT_ERR },
                { value: null, errorId: TEXT_ERR },
                { value: [], errorId: MIN_LEN_ERR, params: ['4'] },
                { value: {}, errorId: MAX_LEN_ERR, params: ['9'] },
                {
                    value: 1234567890,
                    errorId: MAX_LEN_ERR,
                    params: ['9'],
                },
                {
                    value: '00001234567',
                    errorId: MAX_LEN_ERR,
                    params: ['9'],
                },
                {
                    value: 'a                     b',
                    errorId: MAX_LEN_ERR,
                    params: ['9'],
                },
                {
                    value: '',
                    errorId: MIN_LEN_ERR,
                    params: ['4'],
                },
                {
                    value: '  ab ',
                    errorId: MIN_LEN_ERR,
                    params: ['4'],
                },
                {
                    value: 'ಭಾರ',
                    errorId: MIN_LEN_ERR,
                    params: ['4'],
                },
                {
                    value: 'ಭಾರತಮಾತೆಯ ಮಡಿಲಲ್ಲಿ ',
                    errorId: MAX_LEN_ERR,
                    params: ['9'],
                },
            ],
        },
        {
            description: 'PAN of type xxxxxnnnnx',
            schema: {
                name: 'name',
                valueType: TEXT,
                regex: '^[a-z]{5}[0-9]{4}[a-zA-Z]$', //this requires exactly 10 characters
                maxLength: 15, //deliberately given more to test the behavior
                minLength: 5, //likewise min length
            },
            okTests: [{ value: 'abcde1234z' }, { value: 'actab3047K' }],
            notOkTests: [
                {
                    value: 'a',
                    errorId: MIN_LEN_ERR,
                    params: ['5'],
                },
                {
                    value: 'abcde1234zzzzzzgsdhgskdhgas dasasgakshg s',
                    errorId: MAX_LEN_ERR,
                    params: ['15'],
                },
                {
                    value: 'abcde12',
                    errorId: TEXT_ERR,
                },
                {
                    value: '0123456789',
                    errorId: TEXT_ERR,
                },
                {
                    value: 'abcde1234zabc',
                    errorId: TEXT_ERR,
                },
            ],
        },
        {
            description: 'schema has max less than min, hence no string would be valid',
            schema: { valueType: TEXT, name: 'name', minLength: 2, maxLength: 1 },
            okTests: [],
            notOkTests: [
                {
                    value: 'x',
                    errorId: MIN_LEN_ERR,
                    params: ['2'],
                },
                {
                    value: 'xx',
                    errorId: MAX_LEN_ERR,
                    params: ['1'],
                },
            ],
        },
    ],
    integer: [
        {
            //default minValue is 0, and max is SAFE_INTEGER
            description: 'default integer',
            schema: {
                name: 'name',
                valueType: INT,
            },
            okTests: [
                { value: 0 },
                { value: 0.01, parsedValue: 0 },
                { value: '8.9', parsedValue: 9 },
            ],
            notOkTests: [
                { value: undefined, errorId: NUMBER_ERR },
                { value: null, errorId: NUMBER_ERR },
                { value: NaN, errorId: NUMBER_ERR },
                { value: '', errorId: NUMBER_ERR },
                { value: 'a12', errorId: NUMBER_ERR },
                { value: '.1.', errorId: NUMBER_ERR },
                {
                    value: -1,
                    errorId: MIN_VAL_ERR,
                    params: ['0'],
                },
                {
                    value: -99999999999,
                    errorId: MIN_VAL_ERR,
                    params: ['0'],
                },
                {
                    value: '9999999999999999999999999999999999999999999999999',
                    errorId: MAX_VAL_ERROR,
                    params: [validation_1.DEFAULT_MAX_NUMBER + ''],
                },
            ],
        },
        {
            description: 'min 18 and max 150',
            schema: {
                name: 'name',
                valueType: INT,
                minValue: 18,
                maxValue: 150,
            },
            okTests: [
                { value: 18 },
                { value: 150 },
                { value: '000150.01', parsedValue: 150 },
                { value: 17.612, parsedValue: 18 },
                { value: 150.455, parsedValue: 150 },
            ],
            notOkTests: [
                {
                    value: 17,
                    errorId: MIN_VAL_ERR,
                    params: ['18'],
                },
            ],
        },
        {
            description: 'testing with -ve min and +ve max with decimal places',
            schema: {
                name: 'name',
                valueType: INT,
                minValue: -10.192, //this is to be rounded to -10
                maxValue: 9.611, ///this is to be rounded to 10
            },
            okTests: [
                { value: '-10.3', parsedValue: -10 },
                { value: -9 },
                { value: 10.4454, parsedValue: 10 },
                { value: 9 },
                { value: 0 },
            ],
            notOkTests: [
                {
                    value: -10.6,
                    errorId: MIN_VAL_ERR,
                    params: ['-10'],
                },
                { value: -11, errorId: MIN_VAL_ERR, params: ['-10'] },
                { value: -12, errorId: MIN_VAL_ERR, params: ['-10'] },
                {
                    value: -99999999999999,
                    errorId: MIN_VAL_ERR,
                    params: ['-10'],
                },
                { value: 10.6, errorId: MAX_VAL_ERROR, params: ['10'] },
                { value: 12, errorId: MAX_VAL_ERROR, params: ['10'] },
                {
                    value: 8888888888888,
                    errorId: MAX_VAL_ERROR,
                    params: ['10'],
                },
            ],
        },
        {
            description: 'min and max are -ve. nbrDecimal places is to be ignored',
            schema: {
                name: 'name',
                valueType: INT,
                minValue: -100,
                maxValue: -10,
                //nbrDecimalPlaces: 10, //to be ignored, as this is an integer
            },
            okTests: [
                { value: '-100', parsedValue: -100 },
                { value: -99 },
                { value: -10 },
                { value: -11 },
            ],
            notOkTests: [
                {
                    value: -101,
                    errorId: MIN_VAL_ERR,
                    params: ['-100'],
                },
                {
                    value: -102,
                    errorId: MIN_VAL_ERR,
                    params: ['-100'],
                },
                {
                    value: -99999999999999,
                    errorId: MIN_VAL_ERR,
                    params: ['-100'],
                },
                { value: -9, errorId: MAX_VAL_ERROR, params: ['-10'] },
                { value: -8, errorId: MAX_VAL_ERROR, params: ['-10'] },
                { value: 0, errorId: MAX_VAL_ERROR, params: ['-10'] },
            ],
        },
        {
            description: 'min is more than max. no valid numbers',
            schema: { name: 'name', valueType: INT, minValue: 10, maxValue: 1 },
            okTests: [],
            notOkTests: [
                { value: -11, errorId: MIN_VAL_ERR, params: ['10'] },
                { value: 0, errorId: MIN_VAL_ERR, params: ['10'] },
                {
                    value: 9,
                    errorId: MIN_VAL_ERR,
                    params: ['10'],
                },
                { value: 11, errorId: MAX_VAL_ERROR, params: ['1'] },
                { value: 12, errorId: MAX_VAL_ERROR, params: ['1'] },
                {
                    value: 8888888888888,
                    errorId: MAX_VAL_ERROR,
                    params: ['1'],
                },
            ],
        },
    ],
    decimal: [
        //default decimal is similar to default integer with 2 decimal places
        {
            description: 'default decimal',
            schema: {
                name: 'name',
                valueType: DECIMAL,
            },
            okTests: [
                { value: 0 },
                { value: '0', parsedValue: 0 },
                { value: 0.01 },
                { value: '8.98', parsedValue: 8.98 },
                { value: '8.9785432', parsedValue: 8.98 },
                { value: 0.001, parsedValue: 0 },
                { value: '01.011', parsedValue: 1.01 },
            ],
            notOkTests: [
                { value: undefined, errorId: NUMBER_ERR },
                { value: null, errorId: NUMBER_ERR },
                { value: NaN, errorId: NUMBER_ERR },
                { value: '', errorId: NUMBER_ERR },
                { value: 'a12', errorId: NUMBER_ERR },
                { value: '.1.', errorId: NUMBER_ERR },
                {
                    value: -1,
                    errorId: MIN_VAL_ERR,
                    params: ['0'],
                },
                {
                    value: -99999999999,
                    errorId: MIN_VAL_ERR,
                    params: ['0'],
                },
                {
                    value: '9999999999999999999999999999999999999999999999999',
                    errorId: MAX_VAL_ERROR,
                    params: [validation_1.DEFAULT_MAX_NUMBER + ''],
                },
            ],
        },
        {
            description: 'decimal with +ve min/max values',
            schema: {
                name: 'name',
                valueType: DECIMAL,
                nbrDecimalPlaces: 4,
                minValue: 18,
                maxValue: 150,
            },
            okTests: [
                { value: 17.99999, parsedValue: 18 },
                { value: 18.000111, parsedValue: 18.0001 },
                { value: 150.00000999, parsedValue: 150 },
                { value: '000140.001009099', parsedValue: 140.001 },
            ],
            notOkTests: [
                {
                    value: '150.0009123',
                    errorId: MAX_VAL_ERROR,
                    params: ['150'],
                },
                {
                    value: 151,
                    errorId: MAX_VAL_ERROR,
                    params: ['150'],
                },
                {
                    value: 11111111111111.1111,
                    errorId: MAX_VAL_ERROR,
                    params: ['150'],
                },
                {
                    value: 17.9999012,
                    errorId: MIN_VAL_ERR,
                    params: ['18'],
                },
                {
                    value: 0,
                    errorId: MIN_VAL_ERR,
                    params: ['18'],
                },
                {
                    value: -1111,
                    errorId: MIN_VAL_ERR,
                    params: ['18'],
                },
            ],
        },
        {
            description: 'min is -ve max is +ve.',
            schema: {
                name: 'name',
                valueType: DECIMAL,
                nbrDecimalPlaces: -10, //must be reset to default of 2
                minValue: -10.229, //expect this to be rounded to 10.23
                maxValue: 10.35198, //expect this to be rounded to 10.35
            },
            okTests: [
                { value: '-10.2345', parsedValue: -10.23 },
                { value: -9.9901234, parsedValue: -9.99 },
                { value: 10.35456, parsedValue: 10.35 },
                { value: 9.99900999, parsedValue: 10 },
                { value: 0 },
            ],
            notOkTests: [
                {
                    value: -10.239,
                    errorId: MIN_VAL_ERR,
                    params: ['-10.23'],
                },
                {
                    value: -12,
                    errorId: MIN_VAL_ERR,
                    params: ['-10.23'],
                },
                {
                    value: -99999999999999,
                    errorId: MIN_VAL_ERR,
                    params: ['-10.23'],
                },
                {
                    value: 10.35645,
                    errorId: MAX_VAL_ERROR,
                    params: ['10.35'],
                },
                {
                    value: 12,
                    errorId: MAX_VAL_ERROR,
                    params: ['10.35'],
                },
                {
                    value: 8888888888888,
                    errorId: MAX_VAL_ERROR,
                    params: ['10.35'],
                },
            ],
        },
        {
            description: 'min and max are -ve',
            schema: {
                name: 'name',
                valueType: DECIMAL,
                minValue: -100.11119, //to be rounded to -100.11
                maxValue: -10,
            },
            okTests: [
                { value: '-100.1112122', parsedValue: -100.11 },
                { value: -99.7632, parsedValue: -99.76 },
                { value: -10.0000456, parsedValue: -10 },
                { value: -11.123456, parsedValue: -11.12 },
            ],
            notOkTests: [
                {
                    value: -100.119266,
                    errorId: MIN_VAL_ERR,
                    params: ['-100.11'],
                },
                {
                    value: -102,
                    errorId: MIN_VAL_ERR,
                    params: ['-100.11'],
                },
                {
                    value: -99999999999999,
                    errorId: MIN_VAL_ERR,
                    params: ['-100.11'],
                },
                {
                    value: -9.990912,
                    errorId: MAX_VAL_ERROR,
                    params: ['-10'],
                },
                { value: -8, errorId: MAX_VAL_ERROR, params: ['-10'] },
                { value: 0, errorId: MAX_VAL_ERROR, params: ['-10'] },
            ],
        },
    ],
    date: [
        {
            description: 'default date',
            schema: {
                name: 'name',
                valueType: DATE,
            },
            okTests: [
                { value: TODAY },
                //hoping that this program does not survive another DEFAULT_MAX_RANGE days :-)
                { value: '2023-08-24' },
                { value: '2004-02-29' },
                { value: '2000-02-29' },
                { value: TODAY_MINUS_20 },
                { value: TODAY_PLUS_10 },
                { value: MAX_DATE },
                { value: MIN_DATE },
            ],
            notOkTests: [
                { value: undefined, errorId: DATE_ERR },
                { value: null, errorId: DATE_ERR },
                { value: NaN, errorId: DATE_ERR },
                { value: '', errorId: DATE_ERR },
                { value: 'abcd', errorId: DATE_ERR },
                { value: 2007, errorId: DATE_ERR },
                { value: true, errorId: DATE_ERR },
                { value: '2000/12/20', errorId: DATE_ERR },
                { value: '12/20/2000', errorId: DATE_ERR },
                { value: '20/12/2000', errorId: DATE_ERR },
                { value: '2000.12.20', errorId: DATE_ERR },
                { value: '12-20-2000', errorId: DATE_ERR },
                { value: '20-12-2000', errorId: DATE_ERR },
                { value: '2100-02-29', errorId: DATE_ERR },
                { value: '2111-13-29', errorId: DATE_ERR },
                { value: '1456-02-30', errorId: DATE_ERR },
                { value: '2132-06-31', errorId: DATE_ERR },
                { value: '1634-07-32', errorId: DATE_ERR },
                {
                    value: MAX_DATE_PLUS1,
                    errorId: LATE_ERROR,
                    params: [MAX_DATE],
                },
                {
                    value: MIN_DATE_MINUS1,
                    errorId: EARLY_ERROR,
                    params: [MIN_DATE],
                },
            ],
        },
        {
            description: 'dates in the future, including today',
            schema: {
                name: 'name',
                valueType: DATE,
                maxPastDays: 0,
                maxFutureDays: 10,
            },
            okTests: [{ value: TODAY }, { value: TODAY_PLUS_10 }],
            notOkTests: [
                {
                    value: MAX_DATE,
                    errorId: LATE_ERROR,
                    params: [TODAY_PLUS_10],
                },
                {
                    value: MIN_DATE,
                    errorId: EARLY_ERROR,
                    params: [TODAY],
                },
                {
                    value: TODAY_MINUS_20,
                    errorId: EARLY_ERROR,
                    params: [TODAY],
                },
            ],
        },
        {
            description: 'dates in the past, including today',
            schema: {
                name: 'name',
                valueType: DATE,
                maxPastDays: 20,
                maxFutureDays: 0,
            },
            okTests: [{ value: TODAY }, { value: TODAY_MINUS_20 }],
            notOkTests: [
                {
                    value: MAX_DATE,
                    errorId: LATE_ERROR,
                    params: [TODAY],
                },
                {
                    value: TODAY_PLUS_10,
                    errorId: LATE_ERROR,
                    params: [TODAY],
                },
                {
                    value: MIN_DATE,
                    errorId: EARLY_ERROR,
                    params: [TODAY_MINUS_20],
                },
            ],
        },
    ],
    timestamp: [
        {
            description: 'default time-stamp',
            schema: { name: 'name', valueType: STAMP },
            okTests: [
                { value: NOW },
                { value: NOW_MINUS_20 },
                { value: MAX_TIMESTAMP },
                { value: MIN_TIMESTAMP },
                { value: MIN_DATE + VALID_TIME },
                { value: NOW_PLUS_10 },
                { value: MAX_DATE + VALID_TIME },
                { value: NOW_PLUS_10 },
                //hoping that this program does not survive another DEFAULT_MAX_RANGE days :-)
                { value: '2023-08-24' + ZERO_TIME },
                { value: '2004-02-29' + VALID_TIME },
                { value: '2000-02-29' + ZERO_TIME },
                { value: '2000-02-29T24:00:00.000Z' },
            ],
            notOkTests: [
                { value: undefined, errorId: STAMP_ERR },
                { value: null, errorId: STAMP_ERR },
                { value: NaN, errorId: STAMP_ERR },
                { value: '', errorId: STAMP_ERR },
                { value: 'abcd', errorId: STAMP_ERR },
                { value: 2007, errorId: STAMP_ERR },
                { value: true, errorId: STAMP_ERR },
                { value: '2000/12/20' + VALID_TIME, errorId: STAMP_ERR },
                {
                    value: '12/20/2000T00-23-12.123Z',
                    errorId: STAMP_ERR,
                },
                {
                    value: '2000-12-40T12:13:14.123Z',
                    errorId: STAMP_ERR,
                },
                {
                    value: '2000-12-20Taa:13:14.123Z',
                    errorId: STAMP_ERR,
                },
                {
                    value: '2000-12-20T25:13:14.123Z',
                    errorId: STAMP_ERR,
                },
                {
                    value: '2000-12-20T12:60:14.123Z',
                    errorId: STAMP_ERR,
                },
                {
                    value: '2000-12-20T12:13:60.123Z',
                    errorId: STAMP_ERR,
                },
                {
                    value: '2000-12-20T24:00:00.123Z',
                    errorId: STAMP_ERR,
                },
                {
                    value: MAX_DATE_PLUS1 + VALID_TIME,
                    errorId: LATE_ERROR,
                    params: [MAX_DATE],
                },
                {
                    value: MIN_DATE_MINUS1 + ZERO_TIME,
                    errorId: EARLY_ERROR,
                    params: [MIN_DATE],
                },
            ],
        },
    ],
};
globals_1.describe.each(Object.entries(exports.testSets))('%s', (_desc, cases) => {
    globals_1.describe.each(cases)('$description', ({ schema, okTests, notOkTests }) => {
        const fn = (0, validation_1.createValidationFn)(schema);
        if (okTests && okTests.length) {
            globals_1.it.each(okTests)('"value" should be valid', ({ value, parsedValue }) => {
                //we want to test with Value types though the spec requires string to check their robustness
                const res = fn(value); //Actually value MAY NOT be string
                const pv = parsedValue === undefined ? value : parsedValue;
                (0, globals_1.expect)(res.messages).toBeUndefined();
                (0, globals_1.expect)(res.value).toBe(pv);
            });
        }
        if (notOkTests && notOkTests.length) {
            globals_1.it.each(notOkTests)('"$value" should be invalid', ({ value, errorId, params }) => {
                const res = fn(value);
                (0, globals_1.expect)(res.value).toBeUndefined();
                const error = res.messages && res.messages[0];
                (0, globals_1.expect)(error).toBeDefined();
                (0, globals_1.expect)(error?.messageId).toBe(errorId);
                (0, globals_1.expect)(error?.params).toStrictEqual(params);
            });
        }
    });
});
(0, globals_1.describe)('Invalid ValueType', () => {
    (0, globals_1.it)('should throw an error', () => {
        (0, globals_1.expect)(() => {
            //@ts-expect-error
            (0, validation_1.createValidationFn)({ valueType: 'invalid' });
        }).toThrow();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsaWRhdGlvbi50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi92YWxpZGF0aW9uL3ZhbGlkYXRpb24udGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSw2Q0FLc0I7QUFDdEIsMkNBQXFEO0FBcUJyRCxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDWCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsOEJBQWlCLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztJQUMzQyxDQUFDLElBQUksR0FBRyxDQUFDO0FBQ1gsQ0FBQztBQUNELE1BQU0sUUFBUSxHQUFHLENBQUMsQ0FBQztBQUNuQixNQUFNLGlCQUFpQixHQUFHLENBQUMsR0FBRyxHQUFHLENBQUM7QUFFbEMscUVBQXFFO0FBQ3JFLE1BQU0sR0FBRyxHQUFHLElBQUksSUFBSSxFQUFFLENBQUM7QUFDdkIsTUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ2xDLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUM5QixNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7QUFFOUIsd0NBQXdDO0FBQ3hDLE1BQU0sS0FBSyxHQUFHLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN2RSxNQUFNLFdBQVcsR0FBRyxJQUFJLElBQUksQ0FDMUIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLE9BQU8sR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQ3BELENBQUM7QUFFRixNQUFNLFlBQVksR0FBRyxJQUFJ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