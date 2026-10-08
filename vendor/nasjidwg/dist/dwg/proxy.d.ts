import type { Entity } from '../core/model.js';
/** Decode the cached display list of a proxy entity into real entities.
 *  Anything unrecognized is skipped; a malformed stream yields whatever
 *  was decoded before the damage. */
export declare const decodeProxyGraphics: (data: Uint8Array, layer: string, color: Entity['color']) => Entity[];
