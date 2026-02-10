# SexMetrics

Privacy-first, offline-first PWA that turns an encounter into a timestamped event timeline and deterministic metrics using on-device audio + Whisper ASR. No audio or transcripts are stored.

## Status
- PWA shell + onboarding + session lifecycle
- Mic capture + ring buffer + RMS + silence + rhythm inference
- Whisper WASM pipeline + intent parser (STOP/GO/feedback/etc.)
- Timeline renderer (multi-track)
- Optional DeviceMotion capture (motion magnitude)
- Post-session label + rating saved to local storage

## Local Dev
```bash
pnpm install
pnpm dev
```

## GitHub Pages
This repo deploys automatically on push to `main` via GitHub Actions.

Default URL:
```
https://robbie-med.github.io/sehx/
```

Custom domain:
```
https://sehx.robbiemed.org
```

## Models
Models are downloaded on-demand from Hugging Face (cached locally for offline use).
The app exposes a model selector + download/cache button.

If you want to self-host, update `apps/pwa/public/models/models.json` and `apps/pwa/src/asr/models.ts`.

## Privacy Guarantees (Non-negotiable)
- No audio persistence
- No transcript persistence
- On-device only
- Delete is irreversible

## License
TBD
