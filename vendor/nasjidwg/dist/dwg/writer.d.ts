import type { Drawing } from '../core/model.js';
/** Build an R2004 file around the already-encoded logical sections.
 *  Sections are written uncompressed (compression is optional in the
 *  format: the section map declares method 1 = stored). */
export declare function assemble2004(headerVars: Uint8Array, classes: Uint8Array, objects: Obj[], handseed: number, version: 2004 | 2007 | 2018, 
/** TEMP (header campaign): when given, these full section images replace
 *  everything built above — pure recontainerization for splice tests. */
rawSections?: {
    name: string;
    data: Uint8Array;
}[], 
/** R2018: an AcDb:AcDsPrototype_1b image (solid-modeling payloads). */
acds?: Uint8Array, 
/** The preview image: PNG for R2013+ (2018 here), DIB for R2004. */
preview?: {
    png?: Uint8Array;
    bmp?: Uint8Array;
}): Uint8Array;
export interface Obj {
    handle: number;
    bytes: Uint8Array;
    /** R2010+: bits of handle stream at the tail (written in the prefix). */
    handleBits?: number;
}
export interface DwgWriteResult {
    data: Uint8Array;
    /** Entities that could not be encoded (kept out of the file). */
    skipped: string[];
    /** Entities written as simpler geometry rather than their own record,
     *  so the drawing still shows them. */
    downgraded: string[];
}
export interface DwgWriteOptions {
    /** Keep the source file's handles: every entity and retained object
     *  that carries a `handle` is written under that number, and fresh
     *  structural handles are allocated above the highest one. Sealed
     *  records reference each other by handle; with the numbering stable,
     *  those references stay valid across any number of rewrites without
     *  the library understanding them.
     *
     *  From this release the same promise covers the symbol tables: a
     *  layer, linetype, text style or block header that carries a `handle`
     *  is written under it too, so a record that names a layer by handle
     *  still finds the same layer after the rewrite. */
    preserveHandles?: boolean;
    /** Carry the associative framework (AcDbAssoc* — constraint networks,
     *  variables, geometry dependencies, 2D constraint groups) natively
     *  across the R2013 respelling: an R2018 source's family into an
     *  AC1021 file in the R2010 spelling, an R2010 source's into an AC1032
     *  file in the R2013 one (see assoc.ts — the translation reproduces the
     *  reference's own re-saves bit for bit, and its DXFOUT then lists the
     *  family natively). Off by default: in the reference's AUDIT such a
     *  file still reports silent fixes per network (24 on Structural -
     *  Metric into 2007, with six constraint parameters erased; the
     *  reference's own save of the same records audits clean, and every
     *  record, class pair, reactor and dictionary compared so far is
     *  identical) — until that cause is found the default keeps the
     *  family as before, opaque for an R2007 target and home for an R2010
     *  source into AC1032, which audits clean. */
    respellAssoc?: boolean;
    /** Byte-preserving rewrite. Off by default: `preserveHandles` alone
     *  keeps the classic behaviour of re-encoding every entity from the
     *  model.
     *
     *  When on (and only together with `preserveHandles` — on its own this
     *  option is a documented no-op, because retained bytes name their
     *  layers, styles and blocks by handle and are meaningless under a
     *  renumbering), an entity that still carries the `record` the reader
     *  sealed for it — `readDwg(bytes, { retainRecords: true })` — is
     *  emitted from those exact bytes instead of being re-encoded. The
     *  object map, the size prefix, the R2010+ handle-stream split, the
     *  per-object CRC, the sections and the container are built exactly as
     *  they always are: only the record body is substituted. An untouched
     *  entity therefore survives a read/write cycle byte for byte.
     *
     *  THE CONTRACT — read this before switching it on:
     *
     *  1. `record` means "these bytes still describe this entity". The
     *     writer TRUSTS it and does not diff the bytes against the model:
     *     a caller that changes an entity (geometry, layer, colour,
     *     linetype, its handle, the space it lives in) MUST
     *     `delete entity.record` so the writer re-encodes it. Nothing else
     *     is needed — the writer picks the change up from the model.
     *  2. Verbatim emission only happens when the retained bytes are of the
     *     target's own encoding generation (`record.encoding` equals
     *     `encodingGroup(version)`: 14, 2000, 2004, 2007 or 2018). Writing
     *     an R2018 record into an R2000 file would be writing foreign
     *     bytes, so those entities are re-encoded instead — the option is
     *     always safe to leave on across releases.
     *  3. The bytes name layers, linetypes, styles and blocks by their
     *     SOURCE handles, so verbatim emission is switched off wholesale
     *     for the drawing unless every symbol-table handle was preserved
     *     (missing or colliding, and it falls back to re-encoding).
     *  4. Entities whose records reach past the symbol tables into objects
     *     this library re-creates rather than preserves — dimension and
     *     leader (DIMSTYLE), mline (MLINESTYLE), image (IMAGEDEF), the
     *     class-numbered records (table, mleader, light, underlay, proxy,
     *     sealed unknowns), the ones with owned sub-entities (INSERT with
     *     attributes, the meshes) and ACIS solids (whose payload the writer
     *     re-builds into the R2018 AcDs section) — are always re-encoded;
     *     so is any entity carrying XDATA, which names its APPID by handle.
     *     Those entities still round-trip exactly as they do without this
     *     option.
     *  5. Pre-R2004 records carry the previous/next sibling handles inside
     *     the record, so there verbatim emission additionally requires that
     *     every entity in the drawing kept its own handle. */
    verbatimRecords?: boolean;
    /** The preview image the file carries for file managers and open
     *  dialogs — the picture a thumbnail handler or a CAD's Open dialog
     *  shows before the drawing is read. Two encodings, because releases
     *  differ in what they accept: `png` is written into R2013+ files
     *  (AC1032 here), `bmp` — a Windows DIB, with or without its 14-byte
     *  file header — into every earlier release. A file gets whichever of
     *  the two its version can hold; supply both to cover any target. The
     *  R2007 container carries no preview from this writer yet. */
    preview?: {
        png?: Uint8Array;
        bmp?: Uint8Array;
    };
}
export declare const writeDwg2000: (drawing: Drawing, opts?: DwgWriteOptions) => DwgWriteResult;
/** R2004 (AC1018) page container flavor of the same writer. */
export declare const writeDwg2004: (drawing: Drawing, opts?: DwgWriteOptions) => DwgWriteResult;
/** R2018 (AC1032) — same page container, R2010+ object type/handle-size
 *  encoding. R2010 and R2013 share the layout. */
export declare const writeDwg2018: (drawing: Drawing, opts?: DwgWriteOptions) => DwgWriteResult;
/** R2007 (AC1021) — the Reed-Solomon page container, with the string
 *  stream R2007 introduced. */
export declare const writeDwg2007: (drawing: Drawing, opts?: DwgWriteOptions) => DwgWriteResult;
/** R13 (AC1012). The oldest release with the bit-packed object format:
 *  same flat section table as R2000, but each record carries its own
 *  handle-stream position mid-body, entity colour is a plain index, and
 *  there is no lineweight or plot style yet. */
export declare const writeDwgR13: (drawing: Drawing, opts?: DwgWriteOptions) => DwgWriteResult;
/** R14 (AC1014) — R13's layout under a later signature. */
export declare const writeDwgR14: (drawing: Drawing, opts?: DwgWriteOptions) => DwgWriteResult;
