/** R2007 LZ77 variant. Writes into dst[dstStart..dstEnd); the stream is
 *  allowed to stop short of dstEnd (callers pre-zero the buffer) but may
 *  never write past it. Exported for the compressor's round-trip tests. */
export declare function decompress(dst: Uint8Array, dstStart: number, dstEnd: number, src: Uint8Array, srcLen: number): void;
/** Pack `src` into a stream `decompress` above reverses byte for byte.
 *
 *  The same greedy matcher as R2004 drives every shape the decoder knows:
 *  the compact form (two bytes, distance to 0x200, length 3..15), both
 *  halves of the near form (three bytes — 0x10..0x1F for length 3..18 to
 *  distance 0x2000, 0x00..0x0F for length 19..50 to distance 0x1000), and
 *  the far form in both its length widths (distance to 0xFFFF).
 *
 *  Two of those shapes are position-dependent, because a reference opcode
 *  means something else when the decoder reads it BETWEEN two matches —
 *  there a high nibble of zero introduces a literal run instead. So the
 *  0x00..0x0F half goes out masked as 0xF0..0xFF in that position (the
 *  decoder strips the mask), and compact length 15, whose opcode is
 *  0xF0..0xFF, is only spelled where it cannot be mistaken for that mask,
 *  i.e. straight after a literal run. Both cases fall back to a form that
 *  reaches the same match one byte wider. Genuine AC1021 streams use every
 *  one of these shapes under exactly the same rules.
 *
 *  Literal runs go out pre-shuffled so placeLiteral restores reading order:
 *  each whole 32-byte group with its four words reversed, the tail scattered
 *  through TAIL_ORDER. Runs of one to seven ride the low three bits of the
 *  byte that ends the reference before them; standalone runs say 8..22 in
 *  one opcode and escape beyond that through a byte, then 16-bit words.
 *  There is no terminator — the stream just ends, so a trailing match
 *  simply leaves its literal-count bits at zero.
 *
 *  Inputs under eight bytes are padded to eight, the shortest opening run;
 *  callers must give the decoder that much room (the library's own callers
 *  always decompress with slack) or store such payloads uncompressed, as
 *  the R2007 writer does — a run that small never shrinks anyway. */
export declare function compressR2007(src: Uint8Array): Uint8Array;
/** Decompressed logical sections of an R2007 DWG, keyed by canonical name
 *  ('AcDb:Header', 'AcDb:Classes', 'AcDb:Handles', 'AcDb:AcDbObjects', ...). */
export declare function readSections2007(data: Uint8Array): Map<string, Uint8Array>;
