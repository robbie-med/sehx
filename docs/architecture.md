# Architecture

## COOP/COEP & Whisper WASM

Whisper WASM uses WebAssembly threads when `crossOriginIsolated` is enabled.
This requires `Cross-Origin-Opener-Policy: same-origin` and
`Cross-Origin-Embedder-Policy: require-corp` headers to unlock
`SharedArrayBuffer` in modern browsers.

When those headers are unavailable (for example during local dev before the
service worker updates or on hosts that do not support COOP/COEP), the app
falls back to single-thread decoding. Expect higher latency and more dropped
transcription windows on low-power devices in this mode.
