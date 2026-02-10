import { useEffect, useMemo, useRef, useState } from "react";
import SplashCarousel from "./onboarding/SplashCarousel";
import SessionControls from "./session/SessionControls";
import { usePermissions } from "./hooks/usePermissions";
import { useSession } from "./hooks/useSession";
import { formatDuration } from "./utils/time";
import { useMicrophone } from "./hooks/useMicrophone";
import { useSignalDetection } from "./hooks/useSignalDetection";
import { usePhaseInference } from "./hooks/usePhaseInference";
import { usePositionInference } from "./hooks/usePositionInference";
import { useOrgasmInference } from "./hooks/useOrgasmInference";
import { useAsr } from "./hooks/useAsr";
import { useModelDownload } from "./hooks/useModelDownload";
import { MODEL_OPTIONS } from "./asr/models";
import { useTimeline } from "./hooks/useTimeline";
import TimelineView from "./timeline/TimelineView";
import type { SignalPoint } from "@sexmetrics/core";
import type { TimelinePrimitive } from "@sexmetrics/timeline";
import { addMetric, addSignal, exportSession, listSessions } from "@sexmetrics/storage";
import {
  computeMetrics,
  computeMonthlyTrends,
  computeScore,
  computeWeeklyTrends
} from "@sexmetrics/analytics";
import { sessionBus } from "./session/sessionBus";

const ONBOARD_KEY = "sm_onboarded_v1";
const SPEECH_KEY = "sm_speech_enabled_v1";
const LOW_MEMORY_GB = 4;
const ENGINE_VERSION = "v1";
const INFERENCE_VERSION = "v1";

function pickDefaultModelId() {
  if (typeof navigator === "undefined") return MODEL_OPTIONS[0].id;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const cores = navigator.hardwareConcurrency ?? 4;
  const ua = navigator.userAgent ?? "";
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
  const lowPower = isMobile || (memory ? memory <= LOW_MEMORY_GB : false) || cores <= 4;
  if (lowPower) {
    return MODEL_OPTIONS.find((option) => option.tier === "light")?.id ?? MODEL_OPTIONS[0].id;
  }
  return MODEL_OPTIONS.find((option) => option.tier === "power")?.id ?? MODEL_OPTIONS[0].id;
}

function looksLikeMemoryFailure(message?: string) {
  if (!message) return false;
  return /memory|allocation|wasm|out of memory|malloc/i.test(message);
}

export default function App() {
  const [onboarded, setOnboarded] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const { status, requestMic } = usePermissions();
  const mic = useMicrophone();
  const signals = useSignalDetection(mic.rms, mic.active);
  const lastRhythm = useRef<boolean | null>(null);
  const [modelId, setModelId] = useState(() => pickDefaultModelId());
  const selectedModel =
    MODEL_OPTIONS.find((option) => option.id === modelId) ?? MODEL_OPTIONS[0];
  const sessionSettings = useMemo(
    () => ({
      engineVersion: ENGINE_VERSION,
      inferenceVersion: INFERENCE_VERSION,
      asrModelId: selectedModel.id,
      asrModelUrl: selectedModel.url,
      speechEnabled
    }),
    [selectedModel.id, selectedModel.url, speechEnabled]
  );
  const {
    state: sessionState,
    events,
    elapsedSeconds,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    getElapsedNow,
    hardDeleteSession,
    exportSessionData
  } = useSession(sessionSettings);
  const model = useModelDownload(selectedModel.url);
  const asr = useAsr(
    speechEnabled,
    mic.active,
    mic.rms,
    mic.getWindow,
    model.cached,
    selectedModel.url,
    signals.silenceActive
  );
  const [signalsLog, setSignalsLog] = useState<SignalPoint[]>([]);
  const timeline = useTimeline(events, signalsLog);
  const [metrics, setMetrics] = useState<{ key: string; value: number }[]>([]);
  const [score, setScore] = useState<ReturnType<typeof computeScore> | null>(null);
  const [scrubTime, setScrubTime] = useState(0);
  const [selectedPrimitive, setSelectedPrimitive] = useState<TimelinePrimitive | null>(null);
  const [sessions, setSessions] = useState<
    Awaited<ReturnType<typeof listSessions>>
  >([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<
    Awaited<ReturnType<typeof exportSession>> | null
  >(null);
  const [weeklyTrends, setWeeklyTrends] = useState<
    ReturnType<typeof computeWeeklyTrends>
  >([]);
  const [monthlyTrends, setMonthlyTrends] = useState<
    ReturnType<typeof computeMonthlyTrends>
  >([]);

  useEffect(() => {
    if (sessionState.status === "idle" || sessionState.status === "ended") {
      setSignalsLog([]);
    }
  }, [sessionState.status]);

  useEffect(() => {
    if (!timeline.timeline.duration) return;
    setScrubTime((prev) => Math.min(prev, timeline.timeline.duration));
  }, [timeline.timeline.duration]);

  const activePrimitives = useMemo(() => {
    const { primitives } = timeline.timeline;
    if (!primitives.length) return [];
    return primitives.filter((primitive) => {
      const end = primitive.tEnd ?? primitive.tStart;
      const padding = primitive.kind === "marker" ? 0.5 : 0;
      return scrubTime >= primitive.tStart - padding && scrubTime <= end + padding;
    });
  }, [timeline.timeline, scrubTime]);

  useEffect(() => {
    listSessions().then((rows) => setSessions(rows));
  }, [sessionState.status, sessionState.sessionId]);

  useEffect(() => {
    if (!selectedSessionId) {
      setSelectedSession(null);
      return;
    }
    exportSession(selectedSessionId).then((data) => setSelectedSession(data));
  }, [selectedSessionId]);

  useEffect(() => {
    if (!events.length) {
      setMetrics([]);
      setScore(null);
      return;
    }
    const nextMetrics = computeMetrics(events);
    setMetrics(nextMetrics);
    setScore(computeScore(events));
    if (sessionState.sessionId) {
      nextMetrics.forEach((metric) => {
        addMetric({
          id: crypto.randomUUID(),
          sessionId: sessionState.sessionId!,
          key: metric.key,
          value: metric.value,
          engineVersion: "v1"
        }).catch(() => {});
      });
    }
  }, [events, sessionState.sessionId]);

  useEffect(() => {
    if (!sessionState.sessionId) return;
    import("@sexmetrics/storage").then(({ db }) => {
      db.metrics.toArray().then((rows) => {
        setWeeklyTrends(computeWeeklyTrends(rows));
        setMonthlyTrends(computeMonthlyTrends(rows));
      });
    });
  }, [sessionState.sessionId]);

  useEffect(() => {
    if (!mic.active) return;
    const id = window.setInterval(() => {
      const t = getElapsedNow();
      if (!t) return;
      const sessionId = sessionState.sessionId ?? "active";
      const batch: SignalPoint[] = [
        { sessionId, t, type: "intensity", value: mic.rms },
        { sessionId, t, type: "rhythm", value: signals.rhythm.strength },
        { sessionId, t, type: "silence", value: signals.silenceActive ? 1 : 0 }
      ];
      setSignalsLog((prev) => [...prev, ...batch]);
      batch.forEach((signal) => {
        addSignal({
          id: crypto.randomUUID(),
          sessionId: signal.sessionId,
          t: signal.t,
          type: signal.type,
          value: signal.value
        }).catch(() => {});
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [
    mic.active,
    mic.rms,
    signals.rhythm.strength,
    signals.silenceActive,
    getElapsedNow,
    sessionState.sessionId
  ]);

  usePhaseInference(
    sessionState.status,
    signals.rhythm.active,
    (type) => sessionBus.emit(type)
  );

  usePositionInference(
    sessionState.status,
    events,
    signals.rhythm.active,
    signals.rhythm.strength,
    (type) => sessionBus.emit(type)
  );

  useEffect(() => {
    if (!asr.events.length) return;
    for (const event of asr.events) {
      sessionBus.emit(event);
    }
    asr.clearEvents();
  }, [asr.events, asr.clearEvents]);

  useEffect(() => {
    if (!asr.error) return;
    if (selectedModel.tier !== "power") return;
    if (!looksLikeMemoryFailure(asr.error)) return;
    const lightModel = MODEL_OPTIONS.find((option) => option.tier === "light");
    if (lightModel && lightModel.id !== modelId) {
      setModelId(lightModel.id);
    }
  }, [asr.error, selectedModel.tier, modelId]);

  useOrgasmInference(
    sessionState.status,
    mic.rms,
    signals.rhythm.strength,
    signals.silenceActive,
    (type) => sessionBus.emit(type)
  );

  useEffect(() => {
    if (!mic.active) return;
    if (lastRhythm.current === signals.rhythm.active) return;
    lastRhythm.current = signals.rhythm.active;
    if (signals.rhythm.active) {
      sessionBus.emit("RHYTHM_START");
    } else {
      sessionBus.emit("RHYTHM_STOP");
    }
  }, [signals.rhythm.active, mic.active]);

  useEffect(() => {
    const stored = localStorage.getItem(ONBOARD_KEY);
    setOnboarded(stored === "true");
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(SPEECH_KEY);
    setSpeechEnabled(stored === "true");
  }, []);

  const toggleSpeech = () => {
    setSpeechEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(SPEECH_KEY, String(next));
      return next;
    });
  };

  const handleFinish = () => {
    localStorage.setItem(ONBOARD_KEY, "true");
    setOnboarded(true);
  };

  const handleStart = async () => {
    const result = await requestMic();
    if (result === "granted") {
      await mic.start();
      startSession();
    }
  };

  const handlePause = () => {
    pauseSession();
  };

  const handleResume = () => {
    resumeSession();
  };

  const handleEnd = async () => {
    await mic.stop();
    endSession();
  };

  const handleDelete = async () => {
    if (!sessionState.sessionId) return;
    const ok = window.confirm(
      "Delete this session permanently? This cannot be undone."
    );
    if (!ok) return;
    await hardDeleteSession();
    listSessions().then((rows) => setSessions(rows));
    setSignalsLog([]);
  };

  const handleExport = async () => {
    const data = await exportSessionData();
    if (!data || !sessionState.sessionId) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `session-${sessionState.sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!onboarded) {
    return <SplashCarousel onFinish={handleFinish} />;
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="logo">SexMetrics</div>
        <div className="status">Offline-first shell</div>
      </header>
      <main className="app-main">
        <SessionControls
          micState={status.mic}
          micActive={mic.active}
          rms={mic.rms}
          silenceActive={signals.silenceActive}
          rhythmStrength={signals.rhythm.strength}
          asrReady={asr.ready}
          asrError={asr.error}
          modelCached={model.cached}
          modelDownloading={model.downloading}
          modelProgress={model.progress}
          onDownloadModel={model.download}
          modelId={modelId}
          modelOptions={MODEL_OPTIONS.map((option) => ({
            id: option.id,
            label: option.label
          }))}
          onModelChange={setModelId}
          crossOriginIsolated={window.crossOriginIsolated}
          sharedArrayBuffer={typeof SharedArrayBuffer !== "undefined"}
          speechEnabled={speechEnabled}
          onToggleSpeech={toggleSpeech}
          status={sessionState.status}
          elapsed={formatDuration(elapsedSeconds)}
          onStart={handleStart}
          onPause={handlePause}
          onResume={handleResume}
          onEnd={handleEnd}
          onDeleteSession={handleDelete}
          onExportSession={handleExport}
          error={status.error}
          events={events}
        />
        <div className="timeline-toolbar">
          <div className="toolbar-title">Zoom</div>
          <div className="toolbar-actions">
            {["1m", "5m", "full"].map((level) => (
              <button
                key={level}
                className={`ghost ${timeline.zoom === level ? "active" : ""}`}
                onClick={() => timeline.setZoom(level as "1m" | "5m" | "full")}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
        <TimelineView
          data={timeline.timeline}
          onSelect={(item) => {
            setSelectedPrimitive(item);
            setScrubTime(item.tStart);
          }}
        />
        {timeline.timeline.duration ? (
          <div className="timeline-inspector">
            <div className="scrubber-row">
              <input
                type="range"
                min={0}
                max={timeline.timeline.duration}
                step={0.1}
                value={scrubTime}
                onChange={(event) => setScrubTime(Number(event.target.value))}
              />
              <div className="scrub-time">{formatDuration(scrubTime)}</div>
            </div>
            <div className="inspect-panel">
              {selectedPrimitive ? (
                <>
                  <div className="detail-title">Selected</div>
                  <div className="detail-row">
                    Track: <strong>{selectedPrimitive.track}</strong>
                  </div>
                  <div className="detail-row">
                    Type: <strong>{selectedPrimitive.kind}</strong>
                  </div>
                  <div className="detail-row">
                    Range:{" "}
                    <strong>
                      {formatDuration(selectedPrimitive.tStart)}{" "}
                      {selectedPrimitive.tEnd
                        ? `→ ${formatDuration(selectedPrimitive.tEnd)}`
                        : ""}
                    </strong>
                  </div>
                </>
              ) : activePrimitives.length ? (
                <>
                  <div className="detail-title">Active at scrub</div>
                  {activePrimitives.map((primitive) => (
                    <div key={primitive.id} className="detail-row">
                      <strong>{primitive.label ?? primitive.track}</strong>
                    </div>
                  ))}
                </>
              ) : (
                <div className="session-empty">No events at this time.</div>
              )}
            </div>
          </div>
        ) : null}
        <section className="card review-card">
          <h1>Session review</h1>
          <div className="review-grid">
            <div className="review-list">
              {sessions.length ? (
                sessions.map((session) => (
                  <button
                    key={session.id}
                    className={`session-item ${selectedSessionId === session.id ? "active" : ""}`}
                    onClick={() => setSelectedSessionId(session.id)}
                  >
                    <div className="session-title">
                      {new Date(session.createdAt).toLocaleString()}
                    </div>
                    <div className="session-item-meta">
                      {session.endedAt
                        ? `${Math.max(
                            0,
                            Math.round((session.endedAt - session.createdAt - session.totalPausedMs) / 1000)
                          )}s`
                        : "in progress"}
                    </div>
                  </button>
                ))
              ) : (
                <div className="session-empty">No sessions stored yet.</div>
              )}
            </div>
            <div className="review-detail">
              {selectedSession?.session ? (
                <>
                  <div className="detail-title">Session detail</div>
                  <div className="detail-row">
                    Status: <strong>{selectedSession.session.status}</strong>
                  </div>
                  <div className="detail-row">
                    Events: <strong>{selectedSession.events.length}</strong>
                  </div>
                  <div className="detail-row">
                    Metrics: <strong>{selectedSession.metrics.length}</strong>
                  </div>
                  <div className="detail-row">
                    Signals: <strong>{selectedSession.signals.length}</strong>
                  </div>
                </>
              ) : (
                <div className="session-empty">Select a session to inspect.</div>
              )}
            </div>
          </div>
        </section>
        {metrics.length ? (
          <section className="card metrics-card">
            <h1>Metrics (v1)</h1>
            <div className="metrics-grid">
              {metrics.map((metric) => (
                <div key={metric.key} className="metric-item">
                  <div className="metric-key">{metric.key}</div>
                  <div className="metric-value">{metric.value.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </section>
        ) : null}
        {score ? (
          <section className="card metrics-card">
            <h1>Score</h1>
            <div className="score-total">{score.total.toFixed(1)}</div>
            <div className="metrics-grid">
              {score.components.map((component) => (
                <div key={component.key} className="metric-item">
                  <div className="metric-key">{component.key}</div>
                  <div className="metric-value">
                    {(component.score * 100).toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}
        {(weeklyTrends.length || monthlyTrends.length) ? (
          <section className="card metrics-card">
            <h1>Trends</h1>
            <div className="trend-section">
              <h2>Weekly</h2>
              {weeklyTrends.map((series) => (
                <div key={series.key} className="trend-series">
                  <div className="metric-key">{series.key}</div>
                  <div className="trend-points">
                    {series.points.map((point) => (
                      <span key={point.period} className="trend-point">
                        {point.period}: {point.value.toFixed(2)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="trend-section">
              <h2>Monthly</h2>
              {monthlyTrends.map((series) => (
                <div key={series.key} className="trend-series">
                  <div className="metric-key">{series.key}</div>
                  <div className="trend-points">
                    {series.points.map((point) => (
                      <span key={point.period} className="trend-point">
                        {point.period}: {point.value.toFixed(2)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
