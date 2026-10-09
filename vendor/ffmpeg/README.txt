Unmodified @ffmpeg/core 0.12.10, single-thread WebAssembly distribution.
Copyright FFmpeg contributors, Jerome Wu / ffmpeg.wasm and bundled libraries.
License: GPL-2.0-or-later. Full license: COPYING.GPLv2.txt.
Package: https://www.npmjs.com/package/@ffmpeg/core/v/0.12.10
Corresponding upstream sources and build scripts:
https://github.com/ffmpegwasm/ffmpeg.wasm
https://github.com/ffmpegwasm/ffmpeg.wasm/releases/tag/v0.12.10
FFmpeg source: https://github.com/FFmpeg/FFmpeg/tree/n5.1.4

Only loaded by audio-convert-worker.js on an explicit conversion request.
Input/output files remain in worker memory. No SharedArrayBuffer or custom
COOP/COEP headers are required; this build works with static GitHub Pages.

The original WASM binary is split into 16 MiB chunks for Cloudflare Pages'
25 MiB per-asset limit. The worker verifies SHA-256, assembles the identical
binary in memory, and passes wasmBinary to the unmodified upstream runtime.
ffmpeg-core.manifest.json records the original and per-chunk checksums.
