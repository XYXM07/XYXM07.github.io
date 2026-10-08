import type { Drawing, Entity, HatchBoundary, Point2, Point3, PolylineVertex } from './model.js';
export interface Bounds {
    min: Point2;
    max: Point2;
}
/** 2D affine transform: [a c e; b d f] applied as x' = ax+cy+e, y' = bx+dy+f. */
export interface Transform2 {
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;
}
export declare const identity: () => Transform2;
export declare const compose: (m: Transform2, n: Transform2) => Transform2;
export declare const translation: (tx: number, ty: number) => Transform2;
export declare const rotationT: (rad: number) => Transform2;
export declare const scaling: (sx: number, sy: number) => Transform2;
/** The placement transform of an INSERT (translate ∘ rotate ∘ scale). */
export declare const insertTransform: (position: Point3, scale: Point3, rotation: number) => Transform2;
export declare const applyPt: (m: Transform2, p: Point2) => Point2;
/** Deep-copy any model value (plain JSON data by design). */
export declare const clone: <T>(v: T) => T;
/** 3×3 rotation carrying object coordinates into world coordinates. */
export interface Transform3 {
    xAxis: Point3;
    yAxis: Point3;
    zAxis: Point3;
}
/** The arbitrary-axis algorithm: the OCS basis a normal implies.
 *  Returns null for the identity case, so callers can skip the work. */
export declare const ocsTransform: (extrusion?: Point3) => Transform3 | null;
/** The rotation a saved view applies, as a 2D transform from world
 *  coordinates into the view's own frame. A drawing laid out at an angle
 *  is stored that way in model space and only reads square because the
 *  viewport carries VIEWTWIST; a renderer that draws model coordinates
 *  straight to the canvas shows it turned. The twist turns about the view
 *  TARGET, and pan and zoom compose on top of it.
 *
 *  The sense is the one that squares the drawing, measured rather than
 *  assumed: an AC1014 site plan whose line lengths pile up at 44 and 134
 *  degrees comes out at 0 and 88 under this transform, and stays skewed
 *  under its inverse.
 *
 *  Returns null for an untwisted view, so callers can skip the work. */
export declare const viewTwistTransform: (vport: {
    twist?: number;
    target?: Point3;
}) => Transform2 | null;
/** The basis a UCS defines, ready for `ocsToWcs`. A drawing whose header
 *  carries a turned UCS keeps its rotation there and nowhere else before
 *  R2000, so this is the other half of reading such a file straight.
 *  Returns null when the UCS is the world one. */
export declare const ucsTransform: (ucs?: {
    xAxis: Point3;
    yAxis: Point3;
}) => Transform3 | null;
/** Map one point out of an OCS plane into world coordinates. */
export declare const ocsToWcs: (m: Transform3, p: Point3) => Point3;
/** Rewrite an entity's geometry from its own object plane into world
 *  coordinates, so renderers and measurements need no OCS awareness.
 *  Entities with the default normal are returned untouched.
 *
 *  A mirrored circle is the everyday case: AutoCAD stores it with a
 *  negated normal and a negated centre X, which reads as the wrong place
 *  until this runs. */
export declare const toWcs: (ent: Entity) => Entity;
/** Signed CCW sweep from `start` to `end`, the way AutoCAD reads an arc:
 *  a whole turn only when the file really spells one out. Equal angles are
 *  a zero-length arc — the degenerate leftover of an arc-fit — and NOT the
 *  full circle that `(end - start) mod 2pi` alone would make of them. */
export declare const arcSweep: (start: number, end: number) => number;
/** Sample a bulged polyline segment (excluding the start point). */
export declare const sampleBulge: (p1: Point2, p2: Point2, bulge: number, maxSeg?: number) => Point2[];
/** Flatten polyline vertices (with bulges) into a plain point run. */
export declare const flattenPolyline: (vertices: readonly PolylineVertex[], closed: boolean) => Point2[];
/** Flatten any hatch boundary into a sampled point loop. */
export declare const boundaryPoints: (b: HatchBoundary) => Point2[];
/** 2D bounding box of one entity; null when it has none (xline/ray/unknown). */
export declare const entityBounds: (entity: Entity, blocks?: Drawing['blocks']) => Bounds | null;
/** Model-space bounding box of a drawing (inserts resolved through blocks). */
export declare const drawingBounds: (drawing: Drawing) => Bounds | null;
/** The bounds of the drawing's dense mass, not its raw extents.
 *
 * A stray entity parked megaunits from the content — georeferenced UTM
 * drawings keep junk at the origin, and vice versa — makes drawingBounds
 * frame the real drawing as a dot. Cluster = 5th..95th percentile of
 * entity-bounds centres per axis, grown 2x its span to take in outliers
 * that still belong; the cluster only wins when the full extents dwarf it
 * (>4x linear), so ordinary drawings return exactly drawingBounds. */
export declare const contentBounds: (drawing: Drawing) => Bounds | null;
/** Return a transformed copy of an entity (2D affine; z passes through). */
export declare const transformEntity: (ent: Entity, m: Transform2) => Entity;
/** Explode an INSERT into transformed copies of its block's entities.
 *  Nested inserts are exploded recursively up to `depth`. */
export declare const explodeInsert: (ent: Extract<Entity, {
    type: 'insert';
}>, blocks: Drawing['blocks'], depth?: number) => Entity[];
/** Explode a polyline into lines and arcs (bulges become true arcs). */
export declare const explodePolyline: (ent: Extract<Entity, {
    type: 'polyline';
}>) => Entity[];
