import { useState } from "react";

type DevPanelProps = {
  crossOriginIsolated: boolean;
  sharedArrayBuffer: boolean;
  secureContext: boolean;
  cacheAvailable: boolean;
  asrReady: boolean;
  asrError?: string;
  modelCached: boolean;
  micActive: boolean;
  rms: number;
  motionPermission: string;
};

export default function DevPanel({
  crossOriginIsolated,
  sharedArrayBuffer,
  secureContext,
  cacheAvailable,
  asrReady,
  asrError,
  modelCached,
  micActive,
  rms,
  motionPermission,
}: DevPanelProps) {
  const [open, setOpen] = useState(false);

  const flag = (v: boolean) => (v ? "yes" : "no");

  return (
    <div className="dev-panel">
      <button className="dev-panel-toggle" onClick={() => setOpen((o) => !o)}>
        <span>Dev info</span>
        <span>{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <div className="dev-panel-body">
          <div>coi:&nbsp;&nbsp;&nbsp;&nbsp;{flag(crossOriginIsolated)}</div>
          <div>sab:&nbsp;&nbsp;&nbsp;&nbsp;{flag(sharedArrayBuffer)}</div>
          <div>secure:&nbsp;{flag(secureContext)}</div>
          <div>cache:&nbsp;&nbsp;{flag(cacheAvailable)}</div>
          <div>asr:&nbsp;&nbsp;&nbsp;&nbsp;{asrReady ? "ready" : "not ready"}</div>
          <div>model:&nbsp;&nbsp;{modelCached ? "cached" : "not cached"}</div>
          <div>mic:&nbsp;&nbsp;&nbsp;&nbsp;{flag(micActive)}</div>
          <div>rms:&nbsp;&nbsp;&nbsp;&nbsp;{rms.toFixed(4)}</div>
          <div>motion:&nbsp;{motionPermission}</div>
          {(!crossOriginIsolated || asrError) && (
            <div className="dev-panel-error">
              {!crossOriginIsolated
                ? "COI missing — ASR will not use SharedArrayBuffer"
                : null}
              {asrError ? asrError : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
