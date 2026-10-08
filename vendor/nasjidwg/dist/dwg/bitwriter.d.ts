export declare class BitWriter {
    private buf;
    /** Position in BITS. */
    pos: number;
    private scratch;
    private ensure;
    /** Finished bytes (padded with zero bits to the last byte). */
    bytes(): Uint8Array;
    get byteLength(): number;
    b(v: number): void;
    bb(v: number): void;
    bbb(v: number): void;
    rc(v: number): void;
    raw(bytes: Uint8Array | readonly number[]): void;
    rs(v: number): void;
    rl(v: number): void;
    rll(v: number): void;
    /** BLL — 3-bit byte count, then that many little-endian bytes. */
    bll(v: number): void;
    rd(v: number): void;
    /** BS — bitshort with compact encodings. */
    bs(v: number): void;
    /** BL — bitlong. */
    bl(v: number): void;
    /** BD — bitdouble. */
    bd(v: number): void;
    bd2(x: number, y: number): void;
    bd3(x: number, y: number, z: number): void;
    /** DD — double with default (writes compact 00 when equal). */
    dd(v: number, dflt: number): void;
    /** BT — bit thickness (R2000+). */
    bt(v: number): void;
    /** BE — bit extrusion (R2000+). */
    be(x: number, y: number, z: number): void;
    /** MC — signed modular char. */
    mc(v: number): void;
    /** UMC — unsigned modular char. */
    umc(v: number): void;
    /** MS — modular short. */
    ms(v: number): void;
    /** H — handle reference (code nibble + counter + big-endian bytes). */
    h(code: number, value: number): void;
    /** When set, t() writes into this stream instead (R2007+ string stream). */
    strTarget?: BitWriter;
    /** True when strings are UTF-16 (R2007+). */
    utf16: boolean;
    /** T — length-prefixed (BS) codepage text; ASCII-safe or pre-encoded. */
    t(s: string): void;
    /** TU — length-prefixed (BS) UTF-16LE text (R2007+). */
    tu(s: string): void;
    /** Append `nbits` bits from `bytes`, MSB-first — the exact mirror of a
     *  bit-by-bit capture. Used for opaque payload passthrough (proxies),
     *  where the stream is not byte-aligned and every bit must survive. */
    putBits(bytes: Uint8Array, nbits: number): void;
    /** Append another writer's bits (bit-exact, not byte-aligned). */
    appendBits(other: BitWriter): void;
    /** Advance to the next byte boundary (zero-filled). */
    align(): void;
    /** Fill in an RL placeholder written earlier.
     *
     *  This cannot go through rl(): the byte writers assume they are running
     *  off the end of the buffer and clear the byte ahead of themselves, so
     *  rewinding into the middle of a finished record would wipe the four
     *  bits that follow the field. Thirty-two OR'd bits leave everything
     *  around them exactly as it was. The placeholder must have been zero. */
    patchRl(bitPos: number, v: number): void;
}
export declare class ByteSink {
    private buf;
    length: number;
    private ensure;
    push(...values: number[]): void;
    append(bytes: Uint8Array | readonly number[]): void;
    at(i: number): number;
    set(i: number, v: number): void;
    /** Live window into the accumulated bytes (no copy) — consume it
     *  before the next push, which may reallocate the buffer under it. */
    view(start?: number, end?: number): Uint8Array;
    /** The finished image (an owned copy, trimmed to length). */
    bytes(): Uint8Array;
}
/** The DWG CRC-16 (reflected poly 0xA001, i.e. CRC-16/ARC with a seed). */
export declare const crc16: (seed: number, data: Uint8Array, start?: number, end?: number) => number;
