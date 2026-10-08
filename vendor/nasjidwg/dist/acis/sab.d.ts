/** Convert a SAB payload (bytes or base64) to SAT text.
 *  Returns null when the payload is not a SAB stream it can read. */
export declare const sabToSat: (sab: Uint8Array | string) => string | null;
/** Field kinds in a parsed ACIS record. Ints and doubles stay apart
 *  because the binary form tells them apart and a spline's knot
 *  multiplicities ride beside its knot values. */
export declare const SAB_INT = 0;
export declare const SAB_NUM = 1;
export declare const SAB_STR = 2;
export declare const SAB_BOOL = 3;
export declare const SAB_PTR = 4;
export declare const SAB_IDENT = 5;
export declare const SAB_ENUM = 6;
export declare const SAB_OPEN = 7;
export declare const SAB_CLOSE = 8;
/** An ACIS stream as a flat record graph. Fields live in parallel typed
 *  arrays rather than objects: this drawing's solids carry a quarter of a
 *  million records between them, and one object per field would cost more
 *  than the geometry it describes. Record `i` owns fields
 *  `[start[i], start[i + 1])`; `num` holds the numeric payload, and for
 *  strings and identifiers it holds an index into `text`. */
export interface AcisRecords {
    /** Record names, subclass parts joined with '-' ('straight-curve'). */
    names: string[];
    start: Int32Array;
    kind: Uint8Array;
    num: Float64Array;
    text: string[];
    /** Kernel save version, e.g. 21200. */
    version: number;
    /** True when the stream opens with the ASM signature. */
    asm: boolean;
}
/** The base class of a record name: a 'tedge-edge' is an edge, a
 *  'straight-curve' a curve, a 'plane-surface' a surface. */
export declare const acisBase: (name: string) => string;
/** Parse a SAB payload (bytes, or base64 as the model stores it) into its
 *  record graph. Returns null when no readable stream is present. */
export declare const parseSab: (sab: Uint8Array | string) => AcisRecords | null;
/** Parse a SAT text payload into the same record graph. The dialect is
 *  the same grammar spelled in words, so only the tokenizer differs: '$n'
 *  is a pointer, '@n text' a counted string, a bare word an identifier —
 *  including the ones SAT writes where the binary form carries a boolean
 *  or an enum, which nothing reading this graph needs to tell apart. */
export declare const parseSat: (sat: string) => AcisRecords | null;
