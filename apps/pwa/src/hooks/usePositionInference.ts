import { useEffect, useRef } from "react";
import type { Event, EventType } from "@sexmetrics/core";
import { createPositionInference } from "@sexmetrics/inference";
import type { SessionStatus } from "@sexmetrics/inference";

export function usePositionInference(
  status: SessionStatus,
  events: Event[],
  rhythmActive: boolean,
  rhythmStrength: number,
  emitEvent: (type: "POSITION_CHANGE") => void
) {
  const inferenceRef = useRef(createPositionInference());

  useEffect(() => {
    const outputs = inferenceRef.current.update({
      status,
      events,
      rhythmActive,
      rhythmStrength,
      nowMs: Date.now()
    });
    for (const output of outputs) {
      emitEvent(output as EventType);
    }
  }, [events, rhythmActive, status, emitEvent]);
}
