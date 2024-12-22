"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.util = void 0;
exports.util = {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvY29udHJvbGxlci91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNhLFFBQUEsSUFBSSxHQUFHO0lBQ2xCOzs7O09BSUc7SUFDSCxpQkFBaUIsQ0FDZixZQUFnQyxFQUNoQyxhQUFpQztRQUVqQyxNQUFNLEtBQUssR0FBRyxZQUFZLElBQUksRUFBRSxDQUFDO1FBQ2pDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUNuQixPQUFPLEtBQUssQ0FBQztRQUNmLENBQUM7UUFFRCxJQUFJLGFBQWEsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUNsQyxPQUFPLENBQUMsS0FBSyxHQUFHLEdBQUcsR0FBRyxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDM0QsQ0FBQztRQUVELE9BQU8sYUFBYSxDQUFDO0lBQ3ZCLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsUUFBUSxDQUFDLElBQVEsRUFBRSxRQUFnQjtRQUNqQyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xDLE1BQU0sSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQztRQUN4RCxNQUFNLEdBQUcsR0FBRyxHQUFHLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3RDLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7UUFDNUIsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNqQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7UUFDekIsQ0FBQyxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7UUFDYixDQUFDLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQztRQUNwQixDQUFDLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztRQUN0QixHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4QixDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDVixHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMxQixDQUFDO0NBQ0YsQ0FBQyJ9