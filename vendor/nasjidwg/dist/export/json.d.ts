import type { Drawing } from '../core/model.js';
export declare const writeJson: (drawing: Drawing, pretty?: boolean) => string;
/** Parse a drawing dump; missing collections are defaulted, never fatal. */
export declare const readJson: (text: string) => Drawing;
