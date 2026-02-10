# SOUL.MD — Project Continuity File (SexMetrics)

This file is the authoritative handoff for anyone resuming this project. It captures the product intent, architecture, current implementation, known defects, deployment state, and the exact next steps.

---

## 0) One-line summary
Privacy-first, offline-first PWA that turns an encounter into a timestamped event timeline and deterministic metrics using on-device audio + Whisper ASR. No audio or transcripts are stored.

---

## 1) Product intent & non-negotiables
**Non-negotiables:**
- Offline-first (works with airplane mode on)
- On-device only; no cloud dependence
- No audio persistence
- No transcript persistence
- Deterministic metrics (event-sourced)
- Inspectable numbers (traceable to events + timestamps)
- Privacy language is explicit; no interpretation

**PRD framing:** measurement instrument, not therapy or advice.

---

## 2) Spec alignment (what matters)
- ASR: Whisper tiny/base, quantized, local assets
- Windowing: 10s window, 2–3s step, overlap
- ASR triggers: RMS threshold, silence→speech transition, max interval
- Event taxonomy: matches spec exactly
- Signals: downsampled (2–5Hz) for timeline (currently 1Hz in app)
- Storage: IndexedDB schema-versioned, no blobs for audio/text
- Versioning: sessions store inference engine + ASR model versions

---

## 3) Current build state

### 3.1 App shell
- React + Vite PWA
- Onboarding carousel + consent checklist
- Session controls + status display
- Timeline UI

### 3.2 Session lifecycle
- Session state machine: start/pause/resume/end
- Monotonic session clock abstraction
- Events emitted with timestamps (relative to session start)

### 3.3 Audio capture
- Web Audio mic capture (PCM float32)
- 10-second RAM ring buffer (overwrite)
- RMS intensity calculation
- Silence detection
- Rhythm detection (simple peak heuristic)

### 3.4 ASR
- Whisper WASM runtime wired using `@timur00kh/whisper.wasm`
- Runs in Worker
- Resamples to 16kHz
- Windowing + triggers implemented
- Transcript never stored (parsed then cleared)
- Intent parser emits STOP/GO/POS/NEG/CHANGE/PACE

### 3.5 Inference
- Phase inference: foreplay → intercourse → cooldown (simple rule)
- Position change inference: speech request or rhythm stop
- Orgasm inference: intensity spike + rhythm strength + silence + cooldown
- Rhythm start/stop events emitted on transitions

### 3.6 Timeline
- Timeline builder in `packages/timeline`
- Timeline UI shows multi-tracks + zoom buttons
- Primitives: segments/markers/series built from events + signals

---

## 4) What is NOT done (critical)

### Storage & privacy
- **IndexedDB schema + migrations missing** (S-080)
- **Delete session missing** (S-081)
- **Export session missing** (S-082)
- **No encryption-at-rest** yet
- localStorage still used for session state/events (temporary violation)

### Metrics & scoring
- **Metrics calculators missing** (S-070)
- **Score engine missing** (S-071)
- **Metrics UI missing** (S-072)
- **Trend dashboards missing**

### Architecture drift
- Core logic mostly in `apps/pwa` instead of `packages/*` (wishlist expects packages)
- No “Session Bus” pub/sub abstraction
- Inference engines are hooks, not package modules

### Testing
- No synthetic sessions
- No golden sessions
- No regression tests

---

## 5) Hosting & deployment status

### Current deployment
- GitHub Actions workflow builds `apps/pwa/dist`
- Workflow publishes to `gh-pages` branch via `peaceiris/actions-gh-pages@v4`
- GitHub Pages source set to `gh-pages`

### Critical hosting note
- **Custom domain removed** (CNAME deleted) due to DNS mismatch.
- If you restore custom domain:
  - Add `apps/pwa/public/CNAME`
  - DNS CNAME must point to `robbie-med.github.io`
  - If using Cloudflare, set DNS-only (no proxy) or verify proxy works

### Current issue
- GitHub Pages CDN may cache old redirect; clear by re-deploy + wait 5–10 min.

---

## 6) Operational constraints

### COOP/COEP & WASM threads
- GitHub Pages cannot set COOP/COEP headers
- Worker uses `threads = 1` when `crossOriginIsolated` is false
- Multi-thread only in environments with COOP/COEP

### Models
- Models are NOT in repo (removed)
- Download from Hugging Face, cached via Cache Storage
- Model URLs in:
  - `apps/pwa/src/asr/models.ts`
  - `apps/pwa/public/models/models.json`

---

## 7) Exact code map (high-value files)

### App runtime
- `apps/pwa/src/App.tsx`
- `apps/pwa/src/hooks/useSession.ts`
- `apps/pwa/src/hooks/useMicrophone.ts`
- `apps/pwa/src/hooks/useAsr.ts`
- `apps/pwa/src/hooks/useSignalDetection.ts`
- `apps/pwa/src/hooks/usePhaseInference.ts`
- `apps/pwa/src/hooks/usePositionInference.ts`
- `apps/pwa/src/hooks/useOrgasmInference.ts`

### ASR
- `packages/asr/src/whisper/whisper.worker.ts`
- `packages/asr/src/whisper/WhisperAdapter.ts`
- `packages/asr/src/intentParser.ts`

### Timeline
- `packages/timeline/src/timelineBuilder.ts`
- `apps/pwa/src/timeline/TimelineView.tsx`

### PWA
- `apps/pwa/src/sw.ts` (injectManifest + COOP/COEP headers)
- `apps/pwa/vite.config.ts`

---

## 8) Must-do next steps (strict priority)

1) **Fix Pages serving the app**
   - Confirm Pages source = gh-pages
   - Ensure `https://robbie-med.github.io/sehx/` loads app
2) **Implement IndexedDB schema + repos** (S-080)
3) **Hard delete & export** (S-081/S-082)
4) **Metric calculators** (S-070)
5) **Score engine** (S-071)
6) **Metrics UI** (S-072)
7) **Trend dashboards**
8) **Refactor runtime into packages/** (wishlist)
9) **Testkit + golden sessions** (S-090/91)

---

## 9) Known risks & edge cases
- iOS Safari memory + background throttling
- Whisper WASM performance on mid-range phones
- COOP/COEP unavailability on GH Pages → single-thread only
- HF model download reliability (CORS and large file handling)

---

## 10) Commands

```bash
pnpm install
pnpm dev
pnpm --filter @sexmetrics/pwa build
```

---

## 11) TODO list
See `todo.md` for a full priority-ranked gap list.

