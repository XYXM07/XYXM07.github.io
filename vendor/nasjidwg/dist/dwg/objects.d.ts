import type { BlockParameter, Color, Entity, FileVersion, GeoData, MLeaderStyle, Point2, Point3, PolylineVertex, ProxyObject, TableCell, TableStyle, TableStyleCell, UnknownObject, View, XdataGroup, XdataValue } from '../core/model.js';
import type { DwgClassInfo } from './classes.js';
export interface DecodeContext {
    version: FileVersion;
    v: number;
    codepage?: string;
    classes: Map<number, DwgClassInfo>;
    /** Raw acad release byte at file offset 0x11 (0x1a = R2006). */
    dwgVerByte?: number;
}
export declare const makeContext: (version: FileVersion, classes: Map<number, DwgClassInfo>, codepage?: string, dwgVerByte?: number) => DecodeContext;
/** Base64 for retained binary payloads (browser-safe, no Buffer). */
export declare const toBase64: (bytes: Uint8Array) => string;
export interface TableRecord {
    kind: 'layer' | 'ltype' | 'style' | 'blockHeader' | 'blockControl' | 'tableControl' | 'appid' | 'dimstyle' | 'ucs' | 'view' | 'vport';
    name?: string;
    /** The record belongs to an attached external reference. */
    xrefDependent?: boolean;
    colorIndex?: number;
    rgb?: number;
    frozen?: boolean;
    off?: boolean;
    locked?: boolean;
    plot?: boolean;
    lineweight?: number;
    ltypeHandle?: number;
    description?: string;
    pattern?: number[];
    shapeFile?: boolean;
    font?: string;
    bigFont?: string;
    fixedHeight?: number;
    widthFactor?: number;
    oblique?: number;
    /** STYLE only: the record's own EED, where a TrueType style keeps its
     *  typeface. Resolved to a name by the reader, which is the first place
     *  that knows which APPID each group belongs to. */
    xdata?: XdataGroup[];
    basePoint?: Point3;
    anonymous?: boolean;
    /** An external reference's record: the attached file and whether the
     *  attachment is an overlay. */
    xrefPath?: string;
    xrefOverlay?: boolean;
    firstEntity?: number;
    lastEntity?: number;
    ownedHandles?: number[];
    modelSpace?: number;
    paperSpace?: number;
}
/** One cell style of a TABLESTYLE record, its text style and border
 *  linetypes still as handles (the assembler names them). */
export interface RawTableStyleCell extends Omit<TableStyleCell, 'textStyle' | 'borders'> {
    textStyleHandle?: number;
    borders?: {
        lineweight?: number;
        visible?: boolean;
        color?: Color;
        ltypeHandle?: number;
    }[];
}
/** TABLESTYLE record payload: everything but the dictionary name. */
export interface RawTableStyle extends Omit<TableStyle, 'name' | 'handle' | 'data' | 'title' | 'header' | 'xdata'> {
    data?: RawTableStyleCell;
    title?: RawTableStyleCell;
    header?: RawTableStyleCell;
}
/** MLEADERSTYLE record payload, its four references still as handles. */
export interface RawMLeaderStyle extends Omit<MLeaderStyle, 'name' | 'handle' | 'linetype' | 'arrowBlock' | 'textStyle' | 'blockName' | 'xdata'> {
    ltypeHandle?: number;
    arrowHandle?: number;
    textStyleHandle?: number;
    blockHandle?: number;
}
export interface RawObject {
    handle: number;
    typeName: string;
    isEntity: boolean;
    /** Position in file order, stamped by the reader's main loop (the vertex
     *  sequence fallback needs it; a Map built for it was pure overhead). */
    fileIndex?: number;
    entity?: Entity;
    entmode?: number;
    owner?: number;
    /** The record's extension dictionary, when it has one. */
    xdict?: number;
    /** Persistent reactors (objects only; entity reactors are rebuilt). */
    reactors?: number[];
    layerHandle?: number;
    ltypeFlags?: number;
    ltypeHandle?: number;
    /** TEXT/ATTRIB/ATTDEF/MTEXT: the STYLE record the object is drawn with. */
    styleHandle?: number;
    prev?: number;
    next?: number;
    insert?: {
        blockHeader: number;
        attribs: number[];
        hasAttribs: boolean;
        /** R2000 chain form: first/last ATTRIB handles (walk via .next). */
        chain?: {
            first: number;
            last: number;
        };
    };
    polyline?: {
        is3d: boolean;
        closed: boolean;
        vertexHandles: number[];
        first?: number;
        last?: number;
        /** The header's 70 bits 2/4/128 and its 75 curve type. */
        curveFit?: boolean;
        splineFit?: boolean;
        plineGen?: boolean;
        curveType?: number;
        /** 2D only: elevation and OCS normal of the header. */
        elevation?: number;
        extrusion?: Point3;
    };
    /** VERTEX_2D/3D payload; `flags` is the record's own 70 byte. */
    vertex?: PolylineVertex & {
        z: number;
        flags?: number;
    };
    /** The common entity data of a record that folds into another entity
     *  (a heavy polyline's header, a mesh): decoded before the type-specific
     *  part, applied by the assembler once the folded entity exists. */
    folded?: {
        color: Color;
        ltypeScale: number;
        lineweight?: number;
        invisible: boolean;
        xdata?: XdataGroup[];
    };
    blockName?: string;
    table?: TableRecord;
    /** DIMENSION_*: handle of the anonymous geometry block. */
    dimBlock?: number;
    /** PolylineMesh / PolylinePFace awaiting vertex folding. */
    mesh?: {
        kind: 'grid' | 'faces';
        m?: number;
        n?: number;
        closedM?: boolean;
        closedN?: boolean;
        vertexHandles: number[];
    };
    /** PFaceFace: up to 4 signed 1-based vertex indices. */
    pfaceFace?: number[];
    /** IMAGE/WIPEOUT: IMAGEDEF handle to resolve into a file path. */
    imageDefHandle?: number;
    /** IMAGEDEF object payload. */
    imageDef?: {
        path?: string;
    };
    /** DIMENSION_*: DIMSTYLE handle, resolved to a name by the assembler. */
    dimStyleHandle?: number;
    /** DICTIONARY: entry names paired with their target handles, the
     *  reference code each entry used, and the record's two flags. */
    dictionary?: {
        names: string[];
        handles: number[];
        codes: number[];
        cloning?: number;
        hardOwner?: boolean;
        /** ACDBDICTIONARYWDFLT: the default record's handle. */
        defaultHandle?: number;
    };
    /** ACAD_PROXY_OBJECT (0x1F3): the retained record, named by the
     *  assembler from its owning dictionary. */
    proxyObject?: Omit<ProxyObject, 'handle' | 'name'>;
    /** Any other object the semantic layer could not model: retained sealed
     *  (universal passthrough), named by the assembler when a dictionary
     *  lists it. */
    unknownObject?: Omit<UnknownObject, 'handle' | 'name'>;
    /** LAYOUT object payload (block handle resolved by the assembler). */
    layout?: {
        name: string;
        tabOrder?: number;
        blockHandle?: number;
        limMin?: Point2;
        limMax?: Point2;
        extMin?: Point3;
        extMax?: Point3;
        insBase?: Point3;
        paperSize?: string;
        plotStyleSheet?: string;
    };
    /** GROUP object payload. */
    group?: {
        name: string;
        description?: string;
        selectable?: boolean;
        members: number[];
    };
    /** MLINESTYLE object payload. Each element's linetype is a handle
     *  from R2018 and a table index before (32767 BYLAYER, 32766 BYBLOCK,
     *  else the record's position in the linetype table's list). */
    mlineStyle?: {
        name: string;
        description?: string;
        flags?: number;
        fillColor?: Color;
        startAngle?: number;
        endAngle?: number;
        elements: {
            offset: number;
            color: Color;
            ltypeHandle?: number;
            ltypeIndex?: number;
        }[];
    };
    /** MLINE: the MLINESTYLE record the entity is drawn with. */
    mlineStyleHandle?: number;
    /** DICTIONARYVAR object payload: the schema byte and the value text. */
    dictionaryVar?: {
        schema: number;
        value: string;
    };
    /** UCS / VIEW / VPORT table payloads. */
    ucs?: {
        name: string;
        origin: Point3;
        xAxis: Point3;
        yAxis: Point3;
        elevation?: number;
        orthoViewType?: number;
        orthoOrigins?: {
            type: number;
            origin: Point3;
        }[];
        baseUcsHandle?: number;
    };
    view?: View;
    vport?: {
        name: string;
        lowerLeft: Point2;
        upperRight: Point2;
        center: Point2;
        height: number;
        aspectRatio?: number;
        direction?: Point3;
        target?: Point3;
        snapBase?: Point2;
        gridSpacing?: Point2;
    };
    /** Extended data parsed from the record's EED chunks. */
    xdata?: XdataGroup[];
    /** XRECORD payload (typed group values). */
    xrecord?: {
        values: XdataValue[];
    };
    /** SORTENTSTABLE payload: entry i pairs ents[i] with sort key sorts[i];
     *  the assembler reorders blockOwner's entity list by ascending key. */
    sortents?: {
        blockOwner: number;
        ents: number[];
        sorts: number[];
    };
    /** R2013+: heavy data lives in the AcDs section, not in the record. */
    hasDsData?: boolean;
    /** MULTILEADER: block content + style handles. */
    mleaderBlock?: number;
    mleaderStyle?: number;
    /** ACAD_TABLE: the block record holding its rendered geometry. */
    tableBlock?: number;
    tableStyle?: number;
    tableContent?: TableGrid;
    /** TABLESTYLE / MLEADERSTYLE object payloads, named by the assembler
     *  from the ACAD_TABLESTYLE / ACAD_MLEADERSTYLE dictionaries. */
    tableStyleObj?: RawTableStyle;
    mleaderStyleObj?: RawMLeaderStyle;
    /** ACAD_TABLE: block record handle per block-content cell, by cell
     *  index (the assembler resolves the names). */
    tableCellBlocks?: Map<number, number>;
    /** ACAD_TABLE: text-style handle per cell that overrides its style,
     *  by cell index (the assembler resolves the names). */
    tableCellTextStyles?: Map<number, number>;
    /** ATTDEF: the definition's tag, for the labels that name it by
     *  handle (multileader block labels, table block cells). */
    attTag?: string;
    /** GEODATA payload. */
    geoData?: GeoData;
    /** PDF/DGN/DWF UNDERLAY: definition handle to resolve into a path. */
    underlayDefHandle?: number;
    /** PDF/DGN/DWF DEFINITION object payload. */
    underlayDef?: {
        path: string;
        itemName: string;
    };
    /** A dynamic block's visibility parameter, before it is bound. */
    visibility?: {
        name: string;
        prompt: string;
        members: number[];
        states: {
            name: string;
            visible: number[];
        }[];
    };
    /** Any other dynamic-block parameter, before it is bound. */
    blockParam?: BlockParameter;
    /** A dynamic-block action; the class itself names the kind. */
    blockAction?: string;
    /** Raw cached display list, decoded by the assembler. */
    proxyGraphics?: Uint8Array;
}
/** Value kind carried by a DXF group code inside XRECORD/XDATA resbufs. */
type ResbufKind = 'string' | 'real' | 'point' | 'int8' | 'int16' | 'int32' | 'int64' | 'bool' | 'binary' | 'handle' | 'invalid';
export declare const resbufKind: (gc: number) => ResbufKind;
/** The bit-encoding generation of an object's interior. Records keep the
 *  same specific-data encoding within a generation, so sealed bits can be
 *  re-emitted natively inside their own group and must travel wrapped
 *  outside it. */
export declare const encodingGroup: (v: number) => number;
/** Marks a proxy record as a nasjidwg seal-wrap: the low half of the
 *  version word names the payload's encoding group. Real proxies carry
 *  small version words; this magic cannot collide with them. */
export declare const SEAL_MAGIC = 1314062336;
interface TableGrid {
    numRows: number;
    numColumns: number;
    rowHeights: number[];
    columnWidths: number[];
    cells: TableCell[];
    /** Horizontal direction vector; only the R2010+ entity's inline tail
     *  carries it. */
    direction?: Point3;
    /** Title/header rows absent from the row styles (ids 1 and 2). */
    titleSuppressed?: boolean;
    headerSuppressed?: boolean;
    /** Handles the assembler resolves, by cell index: block records of
     *  block cells, text styles of cells overriding theirs. */
    cellBlocks?: Map<number, number>;
    cellTextStyles?: Map<number, number>;
}
/** Decode one object body (the bytes after its MS size field).
 *  `bitsizeOverride` carries the R2010+ handle-stream split. */
export declare const decodeObjectBody: (body: Uint8Array, ctx: DecodeContext, bitsizeOverride?: number) => RawObject | null;
export {};
