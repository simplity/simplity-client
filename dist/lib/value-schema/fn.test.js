"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testSets = void 0;
const fn_1 = require("./fn");
const globals_1 = require("@jest/globals");
let b = '';
for (let i = 0; i < fn_1.DEFAULT_MAX_CHARS; i++) {
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
const maxDate = new Date(Date.UTC(nowYear, nowMon, nowDate + fn_1.DEFAULT_DAYS_RANGE, 0, 0, 0, 0));
const minDate = new Date(Date.UTC(nowYear, nowMon, nowDate - fn_1.DEFAULT_DAYS_RANGE, 0, 0, 0, 0));
const minDateMinus1 = new Date(Date.UTC(nowYear, nowMon, nowDate - fn_1.DEFAULT_DAYS_RANGE - 1));
const maxDatePlus1 = new Date(Date.UTC(nowYear, nowMon, nowDate + fn_1.DEFAULT_DAYS_RANGE + 1));
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
            description: `default text-type. expect min-length as 0 and max length as ${fn_1.DEFAULT_MAX_CHARS}`,
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
                    params: [fn_1.DEFAULT_MAX_CHARS + ''],
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
                    params: [fn_1.DEFAULT_MAX_NUMBER + ''],
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
                    params: [fn_1.DEFAULT_MAX_NUMBER + ''],
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
        const fn = (0, fn_1.createValidationFn)(schema);
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
            (0, fn_1.createValidationFn)({ valueType: 'invalid' });
        }).toThrow();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm4udGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvdmFsdWUtc2NoZW1hL2ZuLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsNkJBS2M7QUFDZCwyQ0FBcUQ7QUFxQnJELElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNYLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxzQkFBaUIsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO0lBQzNDLENBQUMsSUFBSSxHQUFHLENBQUM7QUFDWCxDQUFDO0FBQ0QsTUFBTSxRQUFRLEdBQUcsQ0FBQyxDQUFDO0FBQ25CLE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUVsQyxxRUFBcUU7QUFDckUsTUFBTSxHQUFHLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztBQUN2QixNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDbEMsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQzlCLE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUU5Qix3Q0FBd0M7QUFDeEMsTUFBTSxLQUFLLEdBQUcsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3ZFLE1BQU0sV0FBVyxHQUFHLElBQUksSUFBSSxDQUMxQixJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsT0FBTyxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FDcEQsQ0FBQztBQUVGLE1BQU0sWUFBWSxHQUFHLElBQUksSUFBSSxDQUMzQixJQUFJ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