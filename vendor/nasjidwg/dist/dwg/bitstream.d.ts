export interface HandleRef {
    /** Reference code (high nibble): 2..5 absolute, 6/8 offset ±1,
     *  0xA/0xC offset ±value from the owner handle. */
    code: number;
    /** Raw stored value (meaning depends on code). */
    value: number;
}
/** Resolve a handle reference against its owner's absolute handle. */
export declare const resolveHandle: (ref: HandleRef, owner: number) => number;
export declare class BitReader {
    readonly data: Uint8Array;
    /** Absolute position in BITS from the start of `data`. */
    pos: number;
    /** Hard stop in bits; reads beyond it throw. */
    endBit: number;
    /** Scratch for unaligned doubles; built on first use, since most
     *  readers only ever meet aligned ones. */
    private scratch?;
    /** Byte/double alias pair for the unaligned rd fast path. */
    private sBytes?;
    private sF64?;
    /** A view over the whole buffer, so an aligned double is one read.
     *  `base` is this reader's byte offset within it. */
    private view;
    private base;
    constructor(data: Uint8Array, startBit?: number, endBit?: number);
    atEnd(): boolean;
    private need;
    /** B — one bit. */
    b(): number;
    /** BB — two bits. It fronts every BS/BL/BD in the stream, so it reads
     *  directly with a single bounds check instead of two b() round trips. */
    bb(): number;
    /** 3B — three bits (spec 3B, used by R2007+ section headers). */
    bbb(): number;
    /** RC — raw 8-bit char (may straddle a byte boundary). */
    rc(): number;
    bytes(n: number): Uint8Array;
    /** RS — raw little-endian 16-bit; an aligned read skips the bit path. */
    rs(): number;
    /** RL — raw little-endian 32-bit (unsigned). */
    rl(): number;
    /** RLL — raw little-endian 64-bit, as a JS number (safe for file sizes). */
    rll(): number;
    /** RD — raw little-endian IEEE double. Doubles dominate the stream, so
     *  the aligned case reads straight out of the file view and the
     *  unaligned case fills a reused scratch: neither allocates. */
    rd(): number;
    /** BS — bitshort. */
    bs(): number;
    /** BL — bitlong. */
    bl(): number;
    /** BLL — bitlonglong: 3-bit byte count, then that many bytes (LE). */
    bll(): number;
    /** BD — bitdouble. */
    bd(): number;
    bd2(): [number, number];
    bd3(): [number, number, number];
    rd2(): [number, number];
    /** One byte off the bit stream without the rc() bounds ceremony —
     *  caller has already need()ed the whole run. */
    private byteAt;
    /** DD — double with default: patches bytes of the default's LE image. */
    dd(dflt: number): number;
    dd2(dx: number, dy: number): [number, number];
    dd3(dx: number, dy: number, dz: number): [number, number, number];
    /** BT — bit thickness (R2000+): flag bit, then BD when nonzero. */
    bt(): number;
    /** BE — bit extrusion (R2000+): flag bit -> (0,0,1), else 3BD. */
    be(): [number, number, number];
    /** MC — signed modular char (7 bits per byte, LSB first; sign in the
     *  0x40 bit of the final byte). */
    mc(): number;
    /** UMC — unsigned modular char. */
    umc(): number;
    /** MS — modular short (15 bits per LE short, LSW first). */
    ms(): number;
    /** H — handle reference: code nibble + counter nibble + counter bytes
     *  (big-endian). */
    h(): HandleRef;
    /** H resolved against its owner, allocation-free. A large drawing reads
     *  handle references tens of millions of times; the {code,value} object
     *  h() returns was the single biggest source of GC pressure in a whole
     *  readDwg, so the hot path never builds one. */
    hAbs(owner: number): number;
    /** H's raw stored value, allocation-free (for absolute references). */
    hValue(): number;
    /** T — length-prefixed (BS) codepage text. Returns raw bytes; the caller
     *  owns codepage decoding. */
    tBytes(): Uint8Array;
    /** TU — length-prefixed (BS) UTF-16LE text (R2007+). */
    tu(): string;
    /** SN — 16-byte sentinel. */
    sentinel(): Uint8Array;
    /** CRC — align to byte, then RS. */
    crc(): number;
    /** Advance to the next byte boundary. */
    align(): void;
}
/** Decode T-string bytes for a drawing codepage. All common single-byte pages
 *  are supported; unmapped bytes become U+FFFD. */
export declare const decodeCodepage: (bytes: Uint8Array, codepage?: string) => string;
