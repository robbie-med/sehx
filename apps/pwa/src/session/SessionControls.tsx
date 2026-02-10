type SessionControlsProps = {
  micState: string;
  micActive?: boolean;
  status: "idle" | "active" | "paused" | "ended";
  elapsed: string;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  error?: string;
  events: Array<{ id: string; type: string; t: number; confidence?: number }>;
  rms?: number;
  silenceActive?: boolean;
  rhythmStrength?: number;
  asrReady?: boolean;
  asrError?: string;
  modelCached?: boolean;
  modelDownloading?: boolean;
  modelProgress?: number;
  modelSizeBytes?: number;
  modelError?: string;
  onDownloadModel?: () => void;
  onClearModel?: () => void;
  modelId?: string;
  modelOptions?: Array<{ id: string; label: string }>;
  onModelChange?: (id: string) => void;
  crossOriginIsolated?: boolean;
  sharedArrayBuffer?: boolean;
  speechEnabled?: boolean;
  onToggleSpeech?: () => void;
  onDeleteSession?: () => void;
  onExportSession?: () => void;
};

export default function SessionControls({
  micState,
  micActive,
  status,
  elapsed,
  onStart,
  onPause,
  onResume,
  onEnd,
  error,
  events,
  rms,
  silenceActive,
  rhythmStrength,
  asrReady,
  asrError,
  modelCached,
  modelDownloading,
  modelProgress,
  modelSizeBytes,
  modelError,
  onDownloadModel,
  onClearModel,
  modelId,
  modelOptions,
  onModelChange,
  crossOriginIsolated,
  sharedArrayBuffer,
  speechEnabled,
  onToggleSpeech,
  onDeleteSession,
  onExportSession
}: SessionControlsProps) {
  return (
    <section className="card">
      <h1>Session controls</h1>
      <p>Microphone access is requested only when you start a session.</p>
      <div className="session-controls">
        <div className="session-meta">
          <div>
            Status: <strong>{status}</strong>
          </div>
          <div>
            Elapsed: <strong>{elapsed}</strong>
          </div>
          <div>
            Mic status: <strong>{micState}</strong>
          </div>
          <div>
            Mic capture: <strong>{micActive ? "on" : "off"}</strong>
          </div>
          <div>
            Intensity (RMS): <strong>{rms?.toFixed(4) ?? "0.0000"}</strong>
          </div>
          <div>
            Silence: <strong>{silenceActive ? "yes" : "no"}</strong>
          </div>
          <div>
            Rhythm strength: <strong>{(rhythmStrength ?? 0).toFixed(2)}</strong>
          </div>
          <div className="toggle-row">
            Speech recognition:{" "}
            <strong>{speechEnabled ? "on" : "off"}</strong>
            <button className="ghost" onClick={onToggleSpeech}>
              {speechEnabled ? "Disable" : "Enable"}
            </button>
          </div>
          <div>
            ASR ready: <strong>{asrReady ? "yes" : "no"}</strong>
          </div>
          <div>
            Model cached: <strong>{modelCached ? "yes" : "no"}</strong>
          </div>
          <div>
            COI: <strong>{crossOriginIsolated ? "yes" : "no"}</strong>
          </div>
          <div>
            SharedArrayBuffer:{" "}
            <strong>{sharedArrayBuffer ? "yes" : "no"}</strong>
          </div>
        </div>
        <div className="session-actions">
          {status === "idle" || status === "ended" ? (
            <button className="primary" onClick={onStart}>
              Start session
            </button>
          ) : null}
          {status === "active" ? (
            <>
              <button className="ghost" onClick={onPause}>
                Pause
              </button>
              <button className="primary" onClick={onEnd}>
                End
              </button>
            </>
          ) : null}
          {status === "paused" ? (
            <>
              <button className="ghost" onClick={onResume}>
                Resume
              </button>
              <button className="primary" onClick={onEnd}>
                End
              </button>
            </>
          ) : null}
          {status === "ended" ? (
            <>
              <button className="ghost" onClick={onExportSession}>
                Export session
              </button>
              <button className="danger" onClick={onDeleteSession}>
                Delete session
              </button>
            </>
          ) : null}
        </div>
      </div>
      {error ? <div className="permission-error">{error}</div> : null}
      {asrError ? <div className="permission-error">{asrError}</div> : null}
      {!crossOriginIsolated ? (
        <div className="permission-error">
          ASR requires cross-origin isolation. Reload after service worker
          updates, or restart the dev server.
        </div>
      ) : null}
      {!modelCached ? (
        <div className="model-download">
          {modelOptions?.length ? (
            <select
              className="model-select"
              value={modelId}
              onChange={(event) => onModelChange?.(event.target.value)}
              disabled={modelDownloading}
            >
              {modelOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : null}
          <button
            className="ghost"
            onClick={onDownloadModel}
            disabled={modelDownloading}
          >
            {modelDownloading ? "Downloading model..." : "Download Whisper model"}
          </button>
          {modelSizeBytes ? (
            <div className="model-meta">
              {(modelSizeBytes / (1024 * 1024)).toFixed(1)} MB
              {modelSizeBytes > 50 * 1024 * 1024 ? " · Wi-Fi recommended" : ""}
            </div>
          ) : null}
          {modelDownloading ? (
            <div className="model-progress">
              {Math.round((modelProgress ?? 0) * 100)}%
            </div>
          ) : null}
        </div>
      ) : null}
      {modelCached ? (
        <div className="model-download">
          <div className="model-meta">Model cached for offline use.</div>
          <button className="ghost" onClick={onClearModel}>
            Remove cached model
          </button>
        </div>
      ) : null}
      {modelError ? <div className="permission-error">{modelError}</div> : null}
      {events.length ? (
        <div className="event-log">
          <div className="event-title">Events</div>
          <ul>
            {events.map((event) => (
              <li key={event.id}>
                <span className="event-type">{event.type}</span>
                <span className="event-time">{event.t.toFixed(1)}s</span>
                {typeof event.confidence === "number" ? (
                  <span className="event-confidence">
                    {Math.round(event.confidence * 100)}%
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
