export interface MTextStackedText {
    upper: string;
    lower: string;
    /** '/' horizontal bar, '#' diagonal, '^' tolerance (no bar). */
    divider: '/' | '#' | '^';
}
export interface MTextFragment {
    text: string;
    /** Font family from \f|\F (file or family name). */
    font?: string;
    bold?: boolean;
    italic?: boolean;
    /** Absolute height from \H<n>; */
    height?: number;
    /** Relative height factor from \H<n>x; */
    heightFactor?: number;
    /** ACI color from \C<n>; */
    colorAci?: number;
    /** True color from \c<n>; */
    colorRgb?: number;
    underline?: boolean;
    overline?: boolean;
    strike?: boolean;
    /** Width factor from \W<n>; */
    widthFactor?: number;
    /** Oblique angle in degrees from \Q<n>; */
    oblique?: number;
    /** Character tracking from \T<n>; */
    tracking?: number;
    /** Paragraph vertical alignment from \A<n>; (0 bottom, 1 center, 2 top). */
    alignment?: number;
    /** This fragment starts a new paragraph (was preceded by \P). */
    newParagraph?: boolean;
    /** Stacked fraction from \S...;. `text` is empty on such fragments. */
    stacked?: MTextStackedText;
}
/** Parse raw MTEXT contents into ordered styled fragments. */
export declare const parseMtext: (raw: string) => MTextFragment[];
/** Plain text of parsed fragments (paragraphs as \n, fractions as a/b). */
export declare const mtextPlainText: (frags: readonly MTextFragment[]) => string;
/** The paragraph codes (`\p…;`) an older release can show.
 *
 *  The 2008 release of the reference added paragraph alignment, spacing
 *  before/after and typed tab stops, spelled `\px…;` with every distance
 *  in multiples of the text height; the 2004 release knew indents and
 *  plain tab stops (`\pi`, `\pl`, `\pr`, `\pt`) in drawing units; 2000
 *  and R14 knew no paragraph codes at all. Saved into an older release,
 *  the reference rewrites the text the way that release can show it
 *  (and keeps the original under an ACAD_MTEXT_2008_RT xrecord in the
 *  entity's extension dictionary). Measured on its own saves of a text
 *  spelled `\pxqc;…\P\pxi-3,l3,t3;…` at height 2.5: the 2004 file
 *  carries `\pi…,l7.5,t…;` — the distances scaled by the height, the
 *  alignment and spacing gone (emulated by indents the reference
 *  computes from the glyph widths, which is not attempted here) — and
 *  a text without any `\px` keeps its 2004 codes untouched; the 2000
 *  and R14 files carry no `\p…;` code at all (tabs emulated by widened
 *  spaces there, again not attempted). `release` is the target
 *  (13, 14, 2000, 2004, …); 2007 and later return the text as is. */
export declare const flattenMtextParagraphs: (text: string, release: number, height: number) => string;
