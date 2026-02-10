import { useEffect, useRef } from "react";
import type { EventType } from "@sexmetrics/core";
import { createPhaseInference } from "@sexmetrics/inference";
import type { SessionStatus } from "@sexmetrics/inference";

export function usePhaseInference(
  status: SessionStatus,
  rhythmActive: boolean,
  emitEvent: (type: "PHASE_START_FOREPLAY" | "PHASE_END_FOREPLAY" | "PHASE_START_INTERCOURSE" | "PHASE_START_COOLDOWN") => void
) {
  const inferenceRef = useRef(createPhaseInference());

  useEffect(() => {
    const events = inferenceRef.current.update({
      status,
      rhythmActive,
      nowMs: Date.now()
    });
    for (const event of events) {
      emitEvent(event as EventType);
    }
  }, [status, rhythmActive, emitEvent]);
}
