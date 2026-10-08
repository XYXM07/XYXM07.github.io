import type { DimensionEntity, DimStyle, Entity } from './model.js';
/** Generate the drawn form of a dimension as plain entities.
 *  Returns [] when the definition points it needs are absent.
 *
 *  `headerVars` is the drawing's `header.vars`: a DWG's DIMSTYLE table
 *  carries names only, so without it every dimension would be drawn at
 *  this library's defaults instead of the file's own sizes. */
export declare const explodeDimension: (dim: DimensionEntity, style?: DimStyle, headerVars?: Record<string, unknown>) => Entity[];
