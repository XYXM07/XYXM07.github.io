import type { DwgWriteResult } from './writer.js';
import type { Drawing } from '../core/model.js';
/** R10 (AC1006): everything R12 writes except the VIEWPORT entity and the
 *  R11 tables (APPID, DIMSTYLE, VX) — so dimension-style records travel
 *  only as the header's DIM* variables. */
export declare const writeDwgR10: (drawing: Drawing) => DwgWriteResult;
/** R9 (AC1004): R10 minus meshes and inline 3D — z travels in the shared
 *  elevation field, sloped lines as 3DLINE records. */
export declare const writeDwgR9: (drawing: Drawing) => DwgWriteResult;
/** R2.6 (AC1003): the same shape as R9 under the older signature. */
export declare const writeDwgR2_6: (drawing: Drawing) => DwgWriteResult;
/** R2.10 (AC2.10): additionally lacks the DIMENSION record (dimensions go
 *  out as their drawn form), the STYLE bigfont field and the extended
 *  header tail. */
export declare const writeDwgR2_10: (drawing: Drawing) => DwgWriteResult;
