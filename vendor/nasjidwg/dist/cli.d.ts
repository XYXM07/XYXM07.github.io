#!/usr/bin/env node
import type { Drawing } from './core/model.js';
/** Load any supported input into the document model. */
export declare const loadDrawing: (path: string) => Drawing;
export declare const runCli: (argv: string[]) => number;
