import { useEffect, useRef } from "react";
import type { EventType } from "@sexmetrics/core";
import { createOrgasmInference } from "@sexmetrics/inference";
import type { SessionStatus } from "@sexmetrics/inference";

export function useOrgasmInference(
  status: SessionStatus,
  rms: number,
  rhythmStrength: number,
  silenceActive: boolean,
  emitEvent: (type: "ORGASM_EVENT") => void
) {
  const inferenceRef = useRef(createOrgasmInference());

  useEffect(() => {
    const events = inferenceRef.current.update({
      status,
      rms,
      rhythmStrength,
      silenceActive,
      nowMs: Date.now()
    });
    for (const event of events) {
      emitEvent(event as EventType);
    }
  }, [status, rms, rhythmStrength, silenceActive, emitEvent]);
}
