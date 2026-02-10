# TODO (Priority-Ordered Gaps)

Below are deficiencies ranked by **impact × urgency × ease** (highest to lowest). Each item is numbered for tracking.

1. **Fix GitHub Pages source pipeline (app not served)** — must serve built PWA, not Jekyll README; verify Pages source, deploy artifact, and URL. *(Impact: Critical, Ease: High)*
2. **Replace localStorage with IndexedDB schema + repos (S‑080)** — implement sessions/events/signals/metrics tables + migrations; remove localStorage persistence. *(Critical, Medium)*
3. **Implement hard delete (S‑081)** — irreversible removal across sessions/events/signals/metrics. *(Critical, Medium)*
4. **Export session (S‑082)** — JSON export (no audio/text), optional encryption wrapper. *(High, Medium)*
5. **Metric calculators (S‑070)** — counts/durations/latencies/densities from event log. *(High, Medium)*
6. **Score engine (S‑071)** — transparent, decomposable weighted score with “why” breakdown. *(High, Medium)*
7. **Metrics & score UI (S‑072)** — session summary panel, drill‑down math. *(High, Medium)*
8. **Trend dashboards (PRD)** — weekly/monthly trends from stored metrics. *(High, Medium)*
9. **Event bus / runtime decoupling (Wishlist)** — replace direct hook coupling with pub/sub “Session Bus”. *(High, Medium)*
10. **Move core logic into packages (Wishlist)** — capture/dsp/inference/storage/analytics should live in `packages/*`, not app. *(High, Medium)*
11. **Whisper WASM reliability on mobile** — validate on iOS/Android; handle low‑memory and throttling. *(High, Medium)*
12. **ASR intent parsing quality** — replace regex rules with confidence‑weighted semantic patterns; add de‑dup for overlapping windows. *(High, Medium)*
13. **Speech toggle + privacy controls in settings (PRD)** — explicit ON/OFF, default OFF, visible state. *(High, Low)*
14. **Session review UI (PRD)** — session list, per‑session detail view, delete/inspect. *(High, Medium)*
15. **Timeline tap‑to‑inspect + scrubber (Spec)** — inspect events/segments at timestamp. *(High, Medium)*
16. **Timeline track completeness (Spec)** — phases/positions/speech/orgasm/intensity/rhythm/silence with correct semantics. *(High, Medium)*
17. **Determinism/versioning metadata** — store inference engine version + ASR model version per session. *(High, Medium)*
18. **Privacy guardrails at storage layer** — enforce “no audio/transcript” in DB writes, not just static checks. *(High, Medium)*
19. **Silence windows as signals (Spec)** — currently inferred; persist as signal series. *(Medium, Low)*
20. **Rhythm detection fidelity** — spec calls for band‑pass + autocorrelation; current peak heuristic is a placeholder. *(Medium, Medium)*
21. **Phase inference fidelity** — use sustained rhythm onset/offset; current heuristic is basic. *(Medium, Medium)*
22. **Position inference fidelity** — include rhythm signature change + speech, not just rhythm stop. *(Medium, Medium)*
23. **Orgasm inference confidence** — add explicit confidence value and expose in UI. *(Medium, Medium)*
24. **Audio sample‑rate normalization** — implemented in worker; confirm correctness and add tests. *(Medium, Low)*
25. **COOP/COEP strategy** — document single‑thread fallback and performance implications. *(Medium, Low)*
26. **Service worker PWA caching strategy** — verify injectManifest caching and offline behavior. *(Medium, Low)*
27. **Model download UX** — show size, Wi‑Fi warning, retry/resume, and “delete cached model”. *(Medium, Low)*
28. **Testkit + golden sessions (S‑090/S‑091)** — synthetic sessions + regression tests. *(Medium, Medium)*
29. **Permissions: motion capture (PRD)** — optional DeviceMotion pipeline, permission flow. *(Low, Medium)*
30. **Session label + self‑report rating (PRD optional)** — post‑session prompt and storage. *(Low, Low)*
31. **Export encryption (Wishlist/PRD optional)** — WebCrypto archive support. *(Low, Medium)*
32. **Docs** — fill `docs/*` with real architecture/taxonomy/scoring/onboarding copy. *(Low, Low)*
