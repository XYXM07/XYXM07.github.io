import type { Entity, Point3 } from '../core/model.js';
import type { AcisRecords } from './sab.js';
/** Extract the drawable wireframe of a parsed ACIS stream. `isolines` is
 *  the drawing's ISOLINES: how many tessellation lines AutoCAD lays across
 *  each curved face. Four is its default; zero draws edges alone. */
export declare const wiresOfRecords: (r: AcisRecords, isolines?: number) => Point3[][];
/** Extract the wireframe of an ACIS payload, in either dialect. */
export declare const acisWiresFromPayload: (payload: Uint8Array | string, dialect?: 'sab' | 'sat', isolines?: number) => Point3[][];
/** The wireframe curves of any entity carrying a solid-modeller payload,
 *  in model coordinates: a 3DSOLID, a REGION, a BODY, a surface — and a
 *  record still sealed as `unknown`, whose kernel stream sits inside the
 *  retained bits at whatever bit offset the record's own fields left it.
 *
 *  Anything else answers with an empty list. The work happens on the
 *  first call and is remembered against the entity, because a drawing
 *  opens long before anything asks to see its solids. */
export declare const acisWires: (e: Entity, isolines?: number) => Point3[][];
