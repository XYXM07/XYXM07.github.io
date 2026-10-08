import type { Drawing } from '../core/model.js';
export interface SvgOptions {
    /** Output width in px (height follows the drawing's aspect). */
    width?: number;
    background?: string;
    /** Default stroke for ByLayer/ByBlock entities, as #rrggbb. */
    stroke?: string;
    strokeWidth?: number;
}
export declare const writeSvg: (drawing: Drawing, opts?: SvgOptions) => string;
