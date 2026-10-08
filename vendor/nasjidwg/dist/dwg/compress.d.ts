/** Unpack one stream into `out` at `start`; returns the position one past
 *  the last byte written.
 *
 *  How much a stream produces is the stream's own business — it runs to
 *  its terminator — and its back-references may reach behind `start`: the
 *  pages of one logical section share a single window, so a later page
 *  routinely quotes bytes an earlier page produced. Callers therefore hand
 *  in the whole section buffer, never a lone page. */
export declare function decompressR2004Into(src: Uint8Array, out: Uint8Array, start: number): number;
/** Unpack a self-contained block — the page map and section map pages —
 *  to exactly `decompressedSize` bytes. A stream that stops early leaves
 *  the remainder zeroed, which is normal: writers pad these pages. */
export declare function decompressR2004(src: Uint8Array, decompressedSize: number): Uint8Array;
/** What a dialect can express is all the matcher needs to know about it.
 *  The encodings themselves stay with their emitters; these four numbers
 *  are the whole interface between searching and spelling. */
export interface LzRules {
    /** No match may start before this position: the opening literal run has
     *  a smallest expressible size, so the first bytes are always literal. */
    firstMatchAt: number;
    /** The furthest back a reference can reach. */
    maxDistance: number;
    /** The longest copy one back-reference can spell. */
    maxLength: number;
    /** Three-byte matches are only encodable (or only worth their opcode)
     *  up to this distance; beyond it a match must run four bytes or more. */
    shortMatchMaxDistance: number;
}
/** Greedy LZ77 parse of `src` under `rules`, using a hash chain over
 *  3-byte prefixes. Emits, in stream order, each match together with the
 *  literal run in front of it, and finishes with a final `length === 0`
 *  call carrying whatever literals remain. Newer candidates sit earlier in
 *  the chain, so among equal lengths the shortest distance wins — that is
 *  always the cheaper spelling in both dialects. */
export declare function lzParse(src: Uint8Array, rules: LzRules, emit: (litFrom: number, litTo: number, length: number, distance: number) => void): void;
/** Pack `src` into a stream `decompressR2004Into` reverses byte for byte:
 *  a greedy hash-chain matcher over the three back-reference forms, with
 *  literal runs of one to three riding the low bits of the byte that ends
 *  the reference in front of them, and longer runs standing alone. Inputs
 *  under four bytes are padded, because the opening literal opcode cannot
 *  express a shorter run; the decoder's window simply drops the excess. */
export declare function compressR2004(src: Uint8Array): Uint8Array;
