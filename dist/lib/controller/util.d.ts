import { Vo } from 'simplity-types';
export declare const util: {
    /**
     * get effective style for an component based on various parameters
     * @param defaultStyle decided by the component design
     * @param userSpecified style attribute of meta-data
     */
    getEffectiveStyle(defaultStyle: string | undefined, userSpecified: string | undefined): string;
    /**
     * download data as JSON
     * @param data any data object to be downloaded as JSON
     * @param fileName
     */
    download(data: Vo, fileName: string): void;
};
