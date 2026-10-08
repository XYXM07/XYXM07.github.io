export interface ObjectMap {
    /** Entry count; handles[i]/offsets[i] are one pair. Parallel arrays,
     *  not objects: a heavy drawing has ~1.7M entries and a wrapper object
     *  per pair was measurable GC pressure before the decode even began. */
    count: number;
    handles: Float64Array;
    /** Absolute file offset (R13-R2000) or offset into AcDb:AcDbObjects
     *  (R2004+); the reader knows which. */
    offsets: Float64Array;
}
export declare const readObjectMap: (section: Uint8Array) => ObjectMap;
