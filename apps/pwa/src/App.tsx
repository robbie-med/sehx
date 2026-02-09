import { useEffect, useRef, useState } from "react";
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

const ONBOARD_KEY = "sm_onboarded_v1";

export default function App() {
  const [onboarded, setOnboarded] = useState(false);
  const { status, requestMic } = usePermissions();
  const {
    state: sessionState,
    events,
    elapsedSeconds,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    addEventNow,
    getElapsedNow
  } = useSession();
  const mic = useMicrophone();
  const signals = useSignalDetection(mic.rms, mic.active);
  const lastRhythm = useRef<boolean | null>(null);
  const [modelId, setModelId] = useState(MODEL_OPTIONS[0].id);
  const selectedModel =
    MODEL_OPTIONS.find((option) => option.id === modelId) ?? MODEL_OPTIONS[0];
  const model = useModelDownload(selectedModel.url);
  const asr = useAsr(
    mic.active,
    mic.rms,
    mic.getWindow,
    model.cached,
    selectedModel.url,
    signals.silenceActive
  );
  const [signalsLog, setSignalsLog] = useState<SignalPoint[]>([]);
  const timeline = useTimeline(events, signalsLog);

  useEffect(() => {
    if (sessionState.status === "idle" || sessionState.status === "ended") {
      setSignalsLog([]);
    }
  }, [sessionState.status]);

  useEffect(() => {
    if (!mic.active) return;
    const id = window.setInterval(() => {
      const t = getElapsedNow();
      if (!t) return;
      const sessionId = sessionState.sessionId ?? "active";
      setSignalsLog((prev) => [
        ...prev,
        { sessionId, t, type: "intensity", value: mic.rms },
        { sessionId, t, type: "rhythm", value: signals.rhythm.strength },
        { sessionId, t, type: "silence", value: signals.silenceActive ? 1 : 0 }
      ]);
    }, 1000);
    return () => window.clearInterval(id);
  }, [mic.active, mic.rms, signals.rhythm.strength, signals.silenceActive, getElapsedNow, sessionState.sessionId]);

  usePhaseInference(
    sessionState.status,
    signals.rhythm.active,
    (type) => addEventNow(type)
  );

  usePositionInference(
    sessionState.status,
    events,
    signals.rhythm.active,
    (type) => addEventNow(type)
  );

  useEffect(() => {
    if (!asr.events.length) return;
    for (const event of asr.events) {
      addEventNow(event);
    }
    asr.clearEvents();
  }, [asr.events, asr.clearEvents, addEventNow]);

  useOrgasmInference(
    sessionState.status,
    mic.rms,
    signals.rhythm.strength,
    signals.silenceActive,
    (type) => addEventNow(type)
  );

  useEffect(() => {
    if (!mic.active) return;
    if (lastRhythm.current === signals.rhythm.active) return;
    lastRhythm.current = signals.rhythm.active;
    if (signals.rhythm.active) {
      addEventNow("RHYTHM_START");
    } else {
      addEventNow("RHYTHM_STOP");
    }
  }, [signals.rhythm.active, mic.active, addEventNow]);

  useEffect(() => {
    const stored = localStorage.getItem(ONBOARD_KEY);
    setOnboarded(stored === "true");
  }, []);

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
          status={sessionState.status}
          elapsed={formatDuration(elapsedSeconds)}
          onStart={handleStart}
          onPause={handlePause}
          onResume={handleResume}
          onEnd={handleEnd}
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
        <TimelineView data={timeline.timeline} />
      </main>
    </div>
  );
}
