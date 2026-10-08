/** Shape logical Arabic into Presentation Forms-B. Non-Arabic text is
 *  returned unchanged. */
export declare const shapeArabic: (s: string) => string;
/** Undo shapeArabic: presentation forms back to logical letters. */
export declare const unshapeArabic: (s: string) => string;
/** Mirror matched bracket pairs on RTL lines (invert=true to undo). */
export declare const mirrorBrackets: (s: string, invert?: boolean) => string;
/** Reader-side normalization: only text carrying our presentation-forms
 *  signature is unshaped + unmirrored; native logical Arabic from other
 *  producers passes through untouched. */
export declare const normalizeIncomingText: (t: string) => string;
/** True when the string contains any complex-script run (Arabic, Hebrew,
 *  and friends) that needs the MTEXT path to keep its joining. */
export declare const hasComplexScript: (s: string) => boolean;
