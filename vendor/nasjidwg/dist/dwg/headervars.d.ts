import type { FileVersion, HeaderUcs, Point2, Point3 } from '../core/model.js';
export interface HeaderVars {
    insUnits?: number;
    extMin?: Point3;
    extMax?: Point3;
    limMin?: Point2;
    limMax?: Point2;
    ltScale?: number;
    textSize?: number;
    pdMode?: number;
    pdSize?: number;
    clayerHandle?: number;
    textStyleHandle?: number;
    celtypeHandle?: number;
    dimStyleHandle?: number;
    /** CMLSTYLE: the current multiline style's record. */
    cmlStyleHandle?: number;
    /** UCSNAME / PUCSNAME: the named UCS records the current model and
     *  paper coordinate systems are, when they are named ones. */
    ucsNameHandle?: number;
    pUcsNameHandle?: number;
    /** The named objects dictionary's handle: the root the reader walks
     *  to tell the dictionary tree from the extension dictionaries. */
    nodHandle?: number;
    handseed?: number;
    celColorIndex?: number;
    /** UCSORG/UCSXDIR/UCSYDIR: the current coordinate system. A drawing laid
     *  out at an angle carries the rotation here, so dropping it draws the
     *  model turned. */
    ucs?: HeaderUcs;
    /** The paper-space twin (PUCSORG/PUCSXDIR/PUCSYDIR). */
    pUcs?: HeaderUcs;
    measurementMetricUnits?: boolean;
    /** Assorted named scalars, for callers that want more. */
    vars: Record<string, number | string | boolean>;
}
export declare const readHeaderVars: (section: Uint8Array, version: FileVersion, maint: number, codepage?: string) => HeaderVars | null;
