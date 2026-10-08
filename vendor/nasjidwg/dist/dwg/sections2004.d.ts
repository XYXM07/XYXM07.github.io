/** Decompressed logical sections of an R2004+ (non-R2007) DWG, keyed by
 *  canonical name, e.g. 'AcDb:Header', 'AcDb:Classes', 'AcDb:Handles',
 *  'AcDb:AcDbObjects', 'AcDb:SummaryInfo'. */
export declare function readSections2004(data: Uint8Array): Map<string, Uint8Array>;
