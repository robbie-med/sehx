import { useEffect, useMemo, useRef, useState } from "react";
import SplashCarousel from "./onboarding/SplashCarousel";
import RecordView from "./views/RecordView";
import HistoryView from "./views/HistoryView";
import InsightsView from "./views/InsightsView";
import SessionSummary from "./session/SessionSummary";
import DevPanel from "./components/DevPanel";
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
import type { SignalPoint } from "@sexmetrics/core";
import { addMetric, addSignal, exportSession, listSessions } from "@sexmetrics/storage";
import {
  computeMetrics,
  computeMonthlyTrends,
  computeScore,
  computeWeeklyTrends
} from "@sexmetrics/analytics";
import { sessionBus } from "./session/sessionBus";
import { useMotionCapture } from "./hooks/useMotionCapture";

const ONBOARD_KEY = "sm_onboarded_v1";
const SPEECH_KEY = "sm_speech_enabled_v1";
const MOTION_KEY = "sm_motion_enabled_v1";
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
    return MODEL_OPTIONS.find((o) => o.tier === "light")?.id ?? MODEL_OPTIONS[0].id;
  }
  return MODEL_OPTIONS.find((o) => o.tier === "power")?.id ?? MODEL_OPTIONS[0].id;
}

function looksLikeMemoryFailure(message?: string) {
  if (!message) return false;
  return /memory|allocation|wasm|out of memory|malloc/i.test(message);
}

export default function App() {
  const [onboarded, setOnboarded] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<"record" | "history" | "insights">("record");

  const { status, requestMic } = usePermissions();
  const mic = useMicrophone();
  const motion = useMotionCapture();
  const signals = useSignalDetection(mic.rms, mic.active);
  const lastRhythm = useRef<boolean | null>(null);
  const [modelId, setModelId] = useState(() => pickDefaultModelId());
  const selectedModel = MODEL_OPTIONS.find((o) => o.id === modelId) ?? MODEL_OPTIONS[0];

  const sessionSettings = useMemo(
    () => ({
      engineVersion: ENGINE_VERSION,
      inferenceVersion: INFERENCE_VERSION,
      asrModelId: selectedModel.id,
      asrModelUrl: selectedModel.url,
      speechEnabled,
      motionEnabled
    }),
    [selectedModel.id, selectedModel.url, speechEnabled, motionEnabled]
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
    exportSessionData,
    sessionReview,
    setSessionReview
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
  const [score, setScore] = useState<ReturnType<typeof computeScore> | null>(null);
  const [sessions, setSessions] = useState<Awaited<ReturnType<typeof listSessions>>>([]);
  const [weeklyTrends, setWeeklyTrends] = useState<ReturnType<typeof computeWeeklyTrends>>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<ReturnType<typeof computeMonthlyTrends>>([]);

  // Derive current phase label from most recent phase event
  const currentPhase = useMemo(() => {
    const phaseTypes = ["PHASE_START_FOREPLAY", "PHASE_START_INTERCOURSE", "PHASE_START_COOLDOWN"];
    const last = [...events].reverse().find((e) => phaseTypes.includes(e.type));
    if (!last) return sessionState.status === "active" ? "Starting…" : "";
    return (
      {
        PHASE_START_FOREPLAY:    "Foreplay",
        PHASE_START_INTERCOURSE: "Intercourse",
        PHASE_START_COOLDOWN:    "Cooling down",
      }[last.type] ?? ""
    );
  }, [events, sessionState.status]);

  useEffect(() => {
    if (sessionState.status === "idle" || sessionState.status === "ended") {
      setSignalsLog([]);
    }
  }, [sessionState.status]);

  useEffect(() => {
    listSessions().then((rows) => setSessions(rows));
  }, [sessionState.status, sessionState.sessionId]);

  useEffect(() => {
    if (!events.length) {
      setScore(null);
      return;
    }
    const nextMetrics = computeMetrics(events);
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
    if (!mic.active && !motion.state.active) return;
    const id = window.setInterval(() => {
      const t = getElapsedNow();
      if (!t) return;
      const sessionId = sessionState.sessionId ?? "active";
      const batch: SignalPoint[] = [
        { sessionId, t, type: "intensity", value: mic.rms },
        { sessionId, t, type: "rhythm",    value: signals.rhythm.strength },
        { sessionId, t, type: "silence",   value: signals.silenceActive ? 1 : 0 }
      ];
      if (motion.state.active) {
        batch.push({ sessionId, t, type: "motion", value: motion.state.magnitude });
      }
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
    motion.state.active,
    motion.state.magnitude,
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
    const lightModel = MODEL_OPTIONS.find((o) => o.tier === "light");
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
    sessionBus.emit(signals.rhythm.active ? "RHYTHM_START" : "RHYTHM_STOP");
  }, [signals.rhythm.active, mic.active]);

  useEffect(() => {
    const stored = localStorage.getItem(ONBOARD_KEY);
    setOnboarded(stored === "true");
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(SPEECH_KEY);
    setSpeechEnabled(stored === "true");
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(MOTION_KEY);
    setMotionEnabled(stored === "true");
  }, []);

  useEffect(() => {
    if (!motionEnabled) {
      motion.stop();
      return;
    }
    if (sessionState.status === "active") {
      motion.start();
    } else {
      motion.stop();
    }
  }, [motionEnabled, sessionState.status, motion.start, motion.stop]);

  const toggleSpeech = () => {
    setSpeechEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(SPEECH_KEY, String(next));
      return next;
    });
  };

  const toggleMotion = async () => {
    if (motionEnabled) {
      setMotionEnabled(false);
      localStorage.setItem(MOTION_KEY, "false");
      motion.stop();
      return;
    }
    const permission = await motion.requestPermission();
    const next = permission === "granted";
    setMotionEnabled(next);
    localStorage.setItem(MOTION_KEY, String(next));
    if (next && sessionState.status === "active") {
      motion.start();
    }
  };

  const handleFinish = () => {
    localStorage.setItem(ONBOARD_KEY, "true");
    setOnboarded(true);
  };

  const handleStart = async () => {
    const result = await requestMic();
    if (result === "granted") {
      await mic.start();
      if (motionEnabled) motion.start();
      startSession();
    }
  };

  const handlePause = () => {
    motion.stop();
    pauseSession();
  };

  const handleResume = () => {
    if (motionEnabled) motion.start();
    resumeSession();
  };

  const handleEnd = async () => {
    await mic.stop();
    motion.stop();
    endSession();
  };

  const handleDelete = async () => {
    if (!sessionState.sessionId) return;
    const ok = window.confirm("Delete this session permanently? This cannot be undone.");
    if (!ok) return;
    await hardDeleteSession();
    listSessions().then((rows) => setSessions(rows));
    setSignalsLog([]);
  };

  const handleExport = async () => {
    const data = await exportSessionData();
    if (!data || !sessionState.sessionId) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
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
        <div className="logo">Sehx</div>
      </header>

      <nav className="tab-bar">
        {(["record", "history", "insights"] as const).map((tab) => (
          <button
            key={tab}
            className={`tab-btn${activeTab === tab ? " active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      <main className="app-main">
        {activeTab === "record" && (
          <>
            <RecordView
              status={sessionState.status}
              elapsed={formatDuration(elapsedSeconds)}
              rms={mic.rms}
              micActive={mic.active}
              currentPhase={currentPhase}
              onStart={handleStart}
              onPause={handlePause}
              onResume={handleResume}
              onEnd={handleEnd}
              error={status.error}
              speechEnabled={speechEnabled}
              onToggleSpeech={toggleSpeech}
              modelCached={model.cached}
              modelDownloading={model.downloading}
              modelProgress={model.progress}
              onDownloadModel={model.download}
              motionEnabled={motionEnabled}
              motionSupported={motion.state.supported}
              onToggleMotion={toggleMotion}
            />
            {sessionState.status === "ended" && (
              <SessionSummary
                durationSeconds={elapsedSeconds}
                score={score}
                events={events}
                timeline={timeline.timeline}
                sessionLabel={sessionReview.label}
                sessionRating={sessionReview.rating}
                onSessionLabelChange={(v) => setSessionReview({ label: v })}
                onSessionRatingChange={(v) => setSessionReview({ rating: v })}
                onDelete={async () => {
                  await handleDelete();
                  setActiveTab("history");
                }}
                onExport={handleExport}
              />
            )}
          </>
        )}

        {activeTab === "history" && <HistoryView sessions={sessions} />}

        {activeTab === "insights" && (
          <InsightsView weeklyTrends={weeklyTrends} monthlyTrends={monthlyTrends} />
        )}

        <DevPanel
          crossOriginIsolated={window.crossOriginIsolated}
          sharedArrayBuffer={typeof SharedArrayBuffer !== "undefined"}
          secureContext={window.isSecureContext}
          cacheAvailable={typeof caches !== "undefined"}
          asrReady={asr.ready}
          asrError={asr.error}
          modelCached={model.cached}
          micActive={mic.active}
          rms={mic.rms}
          motionPermission={motion.state.permission ?? "unknown"}
        />
      </main>
    </div>
  );
}
