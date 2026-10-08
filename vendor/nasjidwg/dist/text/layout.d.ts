import type { MTextEntity, TextStyle } from '../core/model.js';
export interface MtextLayoutLine {
    /** Characters to draw, in logical order (Arabic already shaped). */
    text: string;
    /** Drop from the entity position down to this line's baseline,
     *  drawing units (positive = further down the page). */
    dy: number;
    /** Estimated advance width of the line, drawing units. */
    width: number;
}
export interface MtextLayout {
    lines: MtextLayoutLine[];
    /** Baseline-to-baseline distance, drawing units. */
    lineStep: number;
    /** Horizontal anchor derived from the attachment point. */
    align: 'left' | 'center' | 'right';
    /** Nominal text height the lines are drawn at. */
    height: number;
}
/** Lay an MTEXT entity out as positioned lines. Fragments come from
 *  `parseMtext` on the raw stream (falling back to the plain text), so
 *  per-fragment heights weight the advance estimates; the entity's width
 *  wraps when set and positive, and the attachment point (1..9, top-left
 *  default — matching what the exporters always did) anchors the block. */
export declare const layoutMtext: (entity: MTextEntity, styles: readonly TextStyle[]) => MtextLayout;
