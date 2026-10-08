import type { Point2, TextEntity, MTextEntity, TextStyle } from '../core/model.js';
export interface ShxGlyph {
    /** Pen travel to the next character's origin, in shape units. */
    advance: number;
    /** Pen-down strokes as polylines in shape units, y up. */
    paths: {
        x: number;
        y: number;
    }[][];
}
export interface ShxFont {
    name: string;
    /** Cap height above the baseline (shape 0). */
    above: number;
    /** Descender depth below the baseline (shape 0). */
    below: number;
    /** Vectorized glyph for a code point; cached. */
    glyph(code: number): ShxGlyph | undefined;
}
/** Parse an SHX file. Returns null for anything that is not one — a
 *  foreign or truncated buffer never throws. */
export declare const parseShx: (bytes: Uint8Array) => ShxFont | null;
/** Parse and register a font under its own name plus any aliases.
 *  Returns the font, or null when the bytes are not an SHX file. */
export declare const registerShxFont: (bytes: Uint8Array, names?: string[]) => ShxFont | null;
/** Look a registered font up by a text style's font file name. */
export declare const findShxFont: (styleFontName?: string) => ShxFont | undefined;
export interface ShxTextOptions {
    height: number;
    rotation?: number;
    widthFactor?: number;
    oblique?: number;
    halign?: string;
    valign?: string;
    /** Baseline-to-baseline distance in text heights. Default 1.25. */
    lineSpacing?: number;
}
/** Lay a text string out as world-space stroke polylines from an SHX
 *  font: position, height (scale = height / above), rotation, width
 *  factor and oblique applied; '\n' starts a new line below. Arabic is
 *  shaped (joined presentation forms) before glyph lookup so it hits the
 *  font's codes. Returns null when ANY code point lacks a glyph — the
 *  caller falls back to its plain text rendering for the whole string,
 *  never a half-and-half mix. */
export declare const renderShxText: (font: ShxFont, text: string, position: Point2, opts: ShxTextOptions) => Point2[][] | null;
/** The exporters' one-call hook: resolve a TEXT/MTEXT entity's style
 *  against the registry and lay its text out. Null when the style's font
 *  is not registered or a glyph is missing — the caller keeps its
 *  existing rendering, so without registered fonts nothing changes. */
export declare const shxTextStrokes: (entity: TextEntity | MTextEntity, styles: readonly TextStyle[]) => Point2[][] | null;
