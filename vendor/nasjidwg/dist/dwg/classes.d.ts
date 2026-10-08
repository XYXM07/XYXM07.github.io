import type { FileVersion } from '../core/model.js';
export interface DwgClassInfo {
    classNum: number;
    dxfName: string;
    cppName: string;
    appName: string;
    isEntity: boolean;
    /** R2004+: the drawing-format code and maintenance number the record
     *  carries for the class (the reference's own files: 33/427 for its
     *  dynamic-block graph classes, say). */
    dwgVersion?: number;
    maintVersion?: number;
}
/** Parse the classes section. Tolerant: returns what it could read. */
export declare const readClasses: (section: Uint8Array, version: FileVersion, codepage?: string) => Map<number, DwgClassInfo>;
