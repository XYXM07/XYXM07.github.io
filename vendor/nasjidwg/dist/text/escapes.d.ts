/** Bytes 0x80..0x9F of Windows-1252 -> Unicode. */
export declare const CP1252_HIGH: readonly number[];
/** Decode CAD text escapes into plain Unicode (and normalize any of our
 *  pre-shaped Arabic back to logical order). */
export declare const decodeCadText: (v: unknown) => string;
/** Writer-side symbol substitution (° Ø ± -> %%d %%c %%p). */
export declare const encodeCadSymbols: (v: unknown) => string;
/** Escape every character above ASCII as \U+XXXX (codepage-safe transport
 *  for ASCII DXF). */
export declare const escapeUnicode: (s: string) => string;
/** Strip MTEXT inline formatting codes down to plain text with \n breaks. */
export declare const stripMtextCodes: (s: string) => string;
