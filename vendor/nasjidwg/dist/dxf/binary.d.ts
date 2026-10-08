export declare const isBinaryDxf: (data: Uint8Array) => boolean;
/** True when the stream uses the pre-R13 single-byte group codes. */
export declare const isNarrowCodeBinaryDxf: (data: Uint8Array) => boolean;
/** Decode binary DXF into (code, value-as-text) pairs. */
export declare const binaryDxfToPairs: (data: Uint8Array) => [number, string][];
/** Encode (code, value-as-text) pairs into binary DXF bytes.
 *  Pass `narrowCodes` for the pre-R13 single-byte form. */
export declare const pairsToBinaryDxf: (pairs: readonly [number, string][], narrowCodes?: boolean) => Uint8Array;
