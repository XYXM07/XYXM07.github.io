export interface Thumbnail {
    format: 'bmp' | 'wmf' | 'png';
    /** Raw image bytes, ready to write to disk or wrap in a data URL. */
    data: Uint8Array;
}
export interface SummaryInfo {
    title?: string;
    subject?: string;
    author?: string;
    keywords?: string;
    comments?: string;
    lastSavedBy?: string;
    revisionNumber?: string;
    hyperlinkBase?: string;
    /** Custom property tag/value pairs. */
    custom?: {
        tag: string;
        value: string;
    }[];
}
/** Extract the embedded preview image, if the file carries one. */
export declare const readThumbnail: (data: Uint8Array, address: number) => Thumbnail | null;
/** Extract the ACIS/ASM binary blobs stored in the AcDs data section
 *  (R2013+ moves 3DSOLID/REGION/BODY payloads out of the object records).
 *  Returned in file order, base64-encoded. */
export declare const readAcDsSabBlobs: (section: Uint8Array) => string[];
/** Parse the AcDb:SummaryInfo section (R2004+). Strings are codepage bytes
 *  in R2004 and UTF-16 from R2007 on; both count the NUL in their length. */
export declare const readSummaryInfo: (section: Uint8Array, utf16: boolean) => SummaryInfo | null;
/** Build the AcDb:AcDsPrototype_1b section carrying the drawing's
 *  solids' SAB payloads, one data record per solid. */
export declare const buildAcDs: (solids: {
    handle: number;
    sab: Uint8Array;
}[]) => Uint8Array | null;
