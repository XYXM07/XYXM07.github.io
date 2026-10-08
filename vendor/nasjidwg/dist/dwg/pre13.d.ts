import type { Drawing, FileVersion } from '../core/model.js';
export declare const preR13Version: (data: Uint8Array) => FileVersion;
/** Read a pre-R13 file into a Drawing. */
export declare const readPreR13: (data: Uint8Array) => Drawing;
