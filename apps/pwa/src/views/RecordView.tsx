import LiveMeter from "../components/LiveMeter";

type RecordViewProps = {
  status: "idle" | "active" | "paused" | "ended";
  elapsed: string;
  rms: number;
  micActive: boolean;
  currentPhase: string;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  error?: string;
  speechEnabled: boolean;
  onToggleSpeech: () => void;
  modelCached: boolean;
  modelDownloading: boolean;
  modelProgress: number;
  onDownloadModel: () => void;
  motionEnabled: boolean;
  motionSupported: boolean;
  onToggleMotion: () => void;
};

export default function RecordView({
  status,
  elapsed,
  rms,
  micActive,
  currentPhase,
  onStart,
  onPause,
  onResume,
  onEnd,
  error,
  speechEnabled,
  onToggleSpeech,
  modelCached,
  modelDownloading,
  modelProgress,
  onDownloadModel,
  motionEnabled,
  motionSupported,
  onToggleMotion,
}: RecordViewProps) {
  const isIdle = status === "idle" || status === "ended";
  const isActive = status === "active";
  const isPaused = status === "paused";

  return (
    <div className="record-view">
      {isIdle ? (
        <div className="record-idle-state">
          <button className="record-btn-start" onClick={onStart}>
            {status === "ended" ? "New\nsession" : "Start"}
          </button>
          {status === "idle" && (
            <p className="record-idle-hint">Tap to begin recording a session.</p>
          )}
          {error && <div className="permission-error">{error}</div>}
        </div>
      ) : (
        <div className="record-active-state">
          <div className="record-elapsed">{elapsed}</div>
          <div className="record-phase-label">{currentPhase}</div>
          {micActive && (
            <div className="record-meter-wrap">
              <LiveMeter rms={rms} active={micActive} />
            </div>
          )}
          <div className="record-controls">
            {isActive && (
              <button className="ghost" onClick={onPause}>
                Pause
              </button>
            )}
            {isPaused && (
              <button className="ghost" onClick={onResume}>
                Resume
              </button>
            )}
            <button className="danger" onClick={onEnd}>
              End session
            </button>
          </div>
        </div>
      )}

      <div className="record-sub-controls">
        <button
          className={`record-toggle-pill${speechEnabled ? " on" : ""}`}
          onClick={onToggleSpeech}
        >
          Voice {speechEnabled ? "on" : "off"}
        </button>
        {motionSupported !== false && (
          <button
            className={`record-toggle-pill${motionEnabled ? " on" : ""}`}
            onClick={onToggleMotion}
          >
            Motion {motionEnabled ? "on" : "off"}
          </button>
        )}
      </div>

      {speechEnabled && !modelCached && (
        <div className="record-model-strip">
          <button className="ghost" onClick={onDownloadModel} disabled={modelDownloading}>
            {modelDownloading
              ? `Downloading voice model… ${Math.round(modelProgress * 100)}%`
              : "Download voice model"}
          </button>
        </div>
      )}
    </div>
  );
}
