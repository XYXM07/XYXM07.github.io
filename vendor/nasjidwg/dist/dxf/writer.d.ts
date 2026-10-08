import type { Drawing } from '../core/model.js';
/** Options of the DXF writer. */
export interface DxfWriteOptions {
    /** Keep every source handle: entities, table records, block records,
     *  layouts, objects and sealed objects leave under the numbers the
     *  source file gave them, and fresh numbers are minted above the
     *  highest of them. What a sealed body names by handle then stays
     *  valid verbatim, so the chains the reference checks — an entity's
     *  ACAD_FIELD → FIELD, a block record's ACAD_ENHANCEDBLOCK → its
     *  evaluation graph, an ACAD_ASSOCNETWORK — survive exactly as the
     *  source spelled them. Off by default: every object is renumbered
     *  from 0x100 in write order, and the handle-typed groups of sealed
     *  bodies are remapped through the output's numbering (nulled when
     *  the target is not written). */
    preserveHandles?: boolean;
}
export declare const writeDxf: (drawing: Drawing, options?: DxfWriteOptions) => string;
/** Write a binary DXF of the same content as writeDxf.
 *  `narrowCodes` selects the pre-R13 single-byte group-code form. */
export declare const writeDxfBinary: (drawing: Drawing, options?: {
    narrowCodes?: boolean;
} & DxfWriteOptions) => Uint8Array;
