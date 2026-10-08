import type { Drawing } from '../core/model.js';
export interface DwgReadOptions {
    /** Verify per-object and section CRCs; mismatches become warnings. */
    checkCrc?: boolean;
    /** Retain every entity's raw record bytes (Entity.record), enabling
     *  byte-preserving rewrites: with `preserveHandles`, a writer of the
     *  same encoding generation emits untouched records verbatim. */
    retainRecords?: boolean;
}
/** Read a DWG file into a Drawing. Throws only when the file structure is
 *  unusable; object-level trouble lands in drawing.warnings. */
export declare const readDwg: (data: Uint8Array, options?: DwgReadOptions) => Drawing;
