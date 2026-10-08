import type { Drawing } from './model.js';
export interface AuditFinding {
    severity: 'error' | 'warning' | 'info';
    /** Stable machine-readable identifier, e.g. 'duplicate-handle'. */
    code: string;
    /** A human sentence naming the exact object at fault. */
    message: string;
    /** Handle of the offending object, when one is known. */
    handle?: string;
}
/** Audit a drawing: every finding a repair pass would act on, errors
 *  first, then warnings, then informational notes. Never throws. */
export declare const auditDrawing: (d: Drawing) => AuditFinding[];
