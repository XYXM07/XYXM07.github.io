import type { Drawing, Point2 } from '../core/model.js';
export interface PdfOptions {
    /** Page width in points (1/72"). Height follows the drawing's aspect. */
    width?: number;
    /** Page height in points. Given, the page is that sheet and the drawing
     *  is placed inside it — fitted, or at `scale` when one is given. */
    height?: number;
    /** Margin in points around the drawing. */
    margin?: number;
    /** Points per drawing unit. Given, the drawing plots at that scale
     *  instead of being fitted (1:100 of a millimetre drawing is
     *  72 / 25.4 / 100). */
    scale?: number;
    /** Extra offset in points, applied after placement. */
    offset?: {
        x: number;
        y: number;
    };
    /** Centre the drawing on the page. Default: true when `height` is set. */
    center?: boolean;
    /** Plot only this rectangle of the drawing (drawing units); anything
     *  outside is clipped away, the way a window plot does. */
    clip?: {
        min: Point2;
        max: Point2;
    };
    /** Every stroke black whatever the entity's colour (monochrome.ctb). */
    monochrome?: boolean;
    /** Colour for ByLayer/ByBlock entities, as 0xrrggbb. */
    stroke?: number;
    /** Line width in points. */
    lineWidth?: number;
    /** Paint a background rectangle in this colour (0xrrggbb). */
    background?: number;
}
export interface PdfResult {
    /** The finished file. */
    data: Uint8Array;
    /** Entities the page could not represent, with the reason. */
    skipped: {
        type: string;
        reason: string;
    }[];
}
export declare const writePdf: (drawing: Drawing, opts?: PdfOptions) => PdfResult;
