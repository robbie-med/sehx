# TODO (Priority-Ordered Gaps)

Below are deficiencies ranked by **impact Ã— urgency Ã— ease** (highest to lowest). Each item is numbered for tracking.

1. **Fix GitHub Pages source pipeline (app not served)** â€” must serve built PWA, not Jekyll README; verify Pages source, deploy artifact, and URL. *(DONE)*
2. **Replace localStorage with IndexedDB schema + repos (Sâ€‘080)** â€” implement sessions/events/signals/metrics tables + migrations; remove localStorage persistence. *(DONE)*
3. **Implement hard delete (Sâ€‘081)** â€” irreversible removal across sessions/events/signals/metrics. *(DONE)*
4. **Export session (Sâ€‘082)** â€” JSON export (no audio/text), optional encryption wrapper. *(DONE)*
5. **Metric calculators (Sâ€‘070)** â€” counts/durations/latencies/densities from event log. *(DONE)*
6. **Score engine (Sâ€‘071)** â€” transparent, decomposable weighted score with â€œwhyâ€ breakdown. *(DONE)*
7. **Metrics & score UI (Sâ€‘072)** â€” session summary panel, drillâ€‘down math. *(DONE)*
8. **Trend dashboards (PRD)** â€” weekly/monthly trends from stored metrics. *(DONE)*
9. **Event bus / runtime decoupling (Wishlist)** â€” replace direct hook coupling with pub/sub â€œSession Busâ€. *(DONE)*
10. **Move core logic into packages (Wishlist)** — capture/dsp/inference/storage/analytics should live in `packages/*`, not app. *(DONE)*
11. **Whisper WASM reliability on mobile** â€” validate on iOS/Android; handle lowâ€‘memory and throttling. *(High, Medium)*
12. **ASR intent parsing quality** â€” replace regex rules with confidenceâ€‘weighted semantic patterns; add deâ€‘dup for overlapping windows. *(High, Medium)*
13. **Speech toggle + privacy controls in settings (PRD)** â€” explicit ON/OFF, default OFF, visible state. *(High, Low)*
14. **Session review UI (PRD)** â€” session list, perâ€‘session detail view, delete/inspect. *(High, Medium)*
15. **Timeline tapâ€‘toâ€‘inspect + scrubber (Spec)** â€” inspect events/segments at timestamp. *(High, Medium)*
16. **Timeline track completeness (Spec)** â€” phases/positions/speech/orgasm/intensity/rhythm/silence with correct semantics. *(High, Medium)*
17. **Determinism/versioning metadata** â€” store inference engine version + ASR model version per session. *(High, Medium)*
18. **Privacy guardrails at storage layer** â€” enforce â€œno audio/transcriptâ€ in DB writes, not just static checks. *(High, Medium)*
19. **Silence windows as signals (Spec)** â€” currently inferred; persist as signal series. *(Medium, Low)*
20. **Rhythm detection fidelity** â€” spec calls for bandâ€‘pass + autocorrelation; current peak heuristic is a placeholder. *(Medium, Medium)*
21. **Phase inference fidelity** â€” use sustained rhythm onset/offset; current heuristic is basic. *(Medium, Medium)*
22. **Position inference fidelity** â€” include rhythm signature change + speech, not just rhythm stop. *(Medium, Medium)*
23. **Orgasm inference confidence** â€” add explicit confidence value and expose in UI. *(Medium, Medium)*
24. **Audio sampleâ€‘rate normalization** â€” implemented in worker; confirm correctness and add tests. *(Medium, Low)*
25. **COOP/COEP strategy** â€” document singleâ€‘thread fallback and performance implications. *(Medium, Low)*
26. **Service worker PWA caching strategy** â€” verify injectManifest caching and offline behavior. *(Medium, Low)*
27. **Model download UX** â€” show size, Wiâ€‘Fi warning, retry/resume, and â€œdelete cached modelâ€. *(Medium, Low)*
28. **Testkit + golden sessions (Sâ€‘090/Sâ€‘091)** â€” synthetic sessions + regression tests. *(Medium, Medium)*
29. **Permissions: motion capture (PRD)** â€” optional DeviceMotion pipeline, permission flow. *(Low, Medium)*
30. **Session label + selfâ€‘report rating (PRD optional)** â€” postâ€‘session prompt and storage. *(Low, Low)*
31. **Export encryption (Wishlist/PRD optional)** â€” WebCrypto archive support. *(Low, Medium)*
32. **Docs** â€” fill `docs/*` with real architecture/taxonomy/scoring/onboarding copy. *(Low, Low)*
