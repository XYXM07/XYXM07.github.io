/** Reed-Solomon code `payload` into interleaved 255-byte blocks. */
export declare const rsEncode: (payload: Uint8Array, dataSize: number, blocks: number) => Uint8Array;
export interface Section2007 {
    name: string;
    data: Uint8Array;
}
/** The 64-bit page CRC. Init is the bitwise NOT of the two LCG steps
 *  taken from the byte count, packed low word then high; the 64-bit
 *  arithmetic and the OR both matter once a page passes ~20 000 bytes,
 *  where the low step's overflow folds into the high half. XOR-out is 0
 *  and the result is stored little-endian. */
export declare const crc64R2007: (data: Uint8Array) => bigint;
/** The header's 64-bit CRC: forward ECMA-182 over the word order, seeded
 *  from the length and complemented on the way out. */
export declare const crc64Normal: (data: Uint8Array, seed: bigint) => bigint;
/** The checking sequence: a random 64-bit key and that key rotated by its
 *  own low five bits, little-endian, CRC-64'd. It certifies nothing but
 *  itself — any key with its matching CRC is accepted. */
export declare const sequenceCrc: (key: bigint) => bigint;
/** The 32-bit sibling: the same chunked Adler R2004 pages use, over the
 *  same word order, seeded from the length by one LCG step (the halves
 *  are used unreduced, exactly as AutoCAD does). */
export declare const cksum32R2007: (data: Uint8Array) => number;
/** Build a complete AC1021 file around already-encoded logical sections. */
export declare const assemble2007: (sections: readonly Section2007[]) => Uint8Array;
