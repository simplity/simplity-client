export const util = {
    /**
     * get effective style for an component based on various parameters
     * @param defaultStyle decided by the component design
     * @param userSpecified style attribute of meta-data
     */
    getEffectiveStyle(defaultStyle, userSpecified) {
        const style = defaultStyle || '';
        if (!userSpecified) {
            return style;
        }
        if (userSpecified.startsWith('+')) {
            return (style + ' ' + userSpecified.substring(1)).trim();
        }
        return userSpecified;
    },
    /**
     * download data as JSON
     * @param data any data object to be downloaded as JSON
     * @param fileName
     */
    download(data, fileName) {
        const json = JSON.stringify(data);
        const blob = new Blob([json], { type: 'octet/stream' });
        const url = URL.createObjectURL(blob);
        const doc = window.document;
        const a = doc.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.target = '_blank';
        a.download = fileName;
        doc.body.appendChild(a);
        a.click();
        doc.body.removeChild(a);
    },
};
//# sourceMappingURL=util.js.map