import type { DwgWriteResult } from './writer.js';
import type { Drawing, Entity, Point2, Point3, SplineEntity } from '../core/model.js';
/** Byte-aligned little-endian builder. */
export declare class W {
    bytes: number[];
    private scratch;
    get len(): number;
    u8(v: number): void;
    u16(v: number): void;
    i16(v: number): void;
    u32(v: number): void;
    f64(v: number): void;
    pt2(x: number, y: number): void;
    pt3(p: Point3): void;
    raw(bytes: ArrayLike<number>): void;
    /** Fixed-length NUL-padded name field. */
    name(s: string, n: number): void;
    /** Length-prefixed string (16-bit count, no terminator). */
    tv(s: string): void;
}
/** Text payloads leave as pure ASCII: %% symbol codes plus \U+ escapes,
 *  which our reader (and modern AutoCAD) fold back to the original. */
export declare const asciiText: (s: string) => string;
export declare const near0: (v: number) => boolean;
export declare const asPolyline: (pts: Point2[], src: Entity, closed?: boolean, elevation?: number) => Entity;
export declare const sampleEllipse: (e: Entity & {
    type: 'ellipse';
}) => Point2[];
/** de Boor evaluation, weights included; falls back to the control
 *  polygon when the knot vector does not fit the degree. */
export declare const sampleSpline: (e: SplineEntity) => Point2[];
export declare const mtextLines: (e: Entity & {
    type: 'mtext';
}) => Entity[];
export declare const explodeMLeader: (e: Entity & {
    type: 'mleader';
}) => Entity[];
export declare const explodeTable: (e: Entity & {
    type: 'table';
}) => Entity[];
export declare const writeDwgR12: (drawing: Drawing) => DwgWriteResult;
