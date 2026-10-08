import type { FileVersion } from '../core/model.js';
/** Numeric rank for version comparisons (pre-R13 releases sort below 13). */
export declare const versionRank: (v: FileVersion) => number;
export declare const detectVersion: (data: Uint8Array) => FileVersion;
export interface SectionLocator {
    id: number;
    address: number;
    size: number;
}
export interface FileHeaderR2000 {
    codepage: string | undefined;
    /** By convention: 0 header vars, 1 classes, 2 handles (object map),
     *  3 ObjFreeSpace, 4 Template, 5 AuxHeader. */
    sections: SectionLocator[];
}
export declare const codepageName: (num: number) => string;
/** Parse the R13-R2000 fixed header (starts right after the 6-byte magic). */
export declare const readFileHeaderR2000: (data: Uint8Array) => FileHeaderR2000;
