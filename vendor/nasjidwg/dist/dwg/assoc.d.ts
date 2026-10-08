export type AssocSpelling = 'pre2013' | 'r2013';
/** The bits of a sealed record of the family, as the readers keep them. */
export interface AssocBits {
    data?: string;
    dataBits?: number;
    strData?: string;
    strBits?: number;
    refs?: {
        code: number;
        value: string;
    }[];
}
/** Whether a class name (DXF spelling, upper case) is one of the
 *  associative framework's. */
export declare const isAssocKind: (kind: string) => boolean;
/** The CLASSES version pair a kind of the family carries in each
 *  spelling — the pair is what tells the reference which spelling the
 *  records are in, not the file's release: the dependency classes
 *  (ACDBASSOCDEPENDENCY, ACDBASSOCGEOMDEPENDENCY, ACDBASSOCVALUEDEPENDENCY,
 *  ASSOCDIMDEPENDENCYBODY) are 27/50 in its 2007 and 2010 saves and
 *  27/175 in its 2013 and 2018 files, the rest of the family the same
 *  in both (27/45 the actions and the network, 28/1 the block parameter
 *  dependency body). A 2007 file of ours carrying the R2010 spelling
 *  under 27/175 had its dependencies read as the R2013 form — the
 *  reference erased them and rebuilt the networks (24 silent AUDIT fixes
 *  on Structural - Metric, six constraint parameters lost); under 27/50
 *  the same file audits clean. Undefined for a kind whose pair does not
 *  change. */
export declare const assocClassPair: (kind: string, spelling: AssocSpelling) => {
    dwgVersion: number;
    maintVersion: number;
} | undefined;
/** A record of the family in the other spelling: the same record when
 *  the spellings agree or the kind is spelled alike in both, null when
 *  the record cannot be carried (an unknown kind of the family, a field
 *  the target cannot hold, a walk that does not land on the last bit). */
export declare const respellAssoc: (kind: string, rec: AssocBits, from: AssocSpelling, to: AssocSpelling) => AssocBits | null;
