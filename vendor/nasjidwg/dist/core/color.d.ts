import type { Color } from './model.js';
/** Standard 256-entry ACI table (published RGB values; 0 is ByBlock). */
export declare const ACI_RGB: readonly number[];
export declare const aciToRgb: (index: number) => number;
/** Nearest ACI index (1..255) for a 0xRRGGBB value. */
export declare const nearestAci: (rgb: number) => number;
/** Effective RGB of a Color, resolving ACI through the table. */
export declare const colorToRgb: (c: Color, fallback?: number) => number;
