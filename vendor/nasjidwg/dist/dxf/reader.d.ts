import type { Drawing } from '../core/model.js';
/** Read an ASCII or binary DXF. Accepts text, or raw bytes (binary DXF is
 *  detected by its sentinel; anything else is decoded as text). */
export declare const readDxf: (text: string | Uint8Array) => Drawing;
