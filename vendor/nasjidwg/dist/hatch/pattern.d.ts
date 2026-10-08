import type { Entity, HatchDefLine, HatchEntity } from '../core/model.js';
export interface HatchPattern {
    name: string;
    description?: string;
    lines: HatchDefLine[];
}
/** Parse a .pat file into its patterns. Malformed lines are skipped. */
export declare const readPatternFile: (text: string) => HatchPattern[];
/** Serialize patterns back to .pat text. */
export declare const writePatternFile: (patterns: readonly HatchPattern[]) => string;
/** Explode a hatch into the line entities its pattern draws inside its
 *  boundaries. Solid fills yield nothing (there is no line work). */
export declare const explodeHatch: (hatch: HatchEntity, pattern?: HatchPattern) => Entity[];
