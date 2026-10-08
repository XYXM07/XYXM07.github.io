import type { Drawing } from '../core/model.js';
interface GeoFeature {
    type: 'Feature';
    properties: Record<string, unknown>;
    geometry: {
        type: string;
        coordinates: unknown;
    } | null;
}
export interface GeoJSONOptions {
    /** Transform drawing coordinates to WGS84 lon/lat through the drawing's
     *  GEODATA anchor. Defaults to on whenever the drawing carries one. */
    georeference?: boolean;
}
export declare const toGeoJSON: (drawing: Drawing, opts?: GeoJSONOptions) => {
    type: 'FeatureCollection';
    features: GeoFeature[];
};
export {};
