/** Resolve one MIF escape to its Unicode character. Unmapped codes fall
 *  back to the raw value so nothing is silently lost. */
export declare const decodeMif: (page: number, code: number) => string;
/** Encode a character as a MIF escape for a given page, when that page can
 *  represent it; returns null otherwise. */
export declare const encodeMif: (ch: string, page: number) => string | null;
