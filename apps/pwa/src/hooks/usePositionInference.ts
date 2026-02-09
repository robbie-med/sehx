import { useEffect, useRef } from "react";
import type { Event } from "@sexmetrics/core";

type SessionStatus = "idle" | "active" | "paused" | "ended";

export function usePositionInference(
  status: SessionStatus,
  events: Event[],
  rhythmActive: boolean,
  emitEvent: (type: "POSITION_CHANGE") => void
) {
  const lastSpeechIndex = useRef(0);
  const lastRhythm = useRef<boolean | null>(null);

  useEffect(() => {
    if (status !== "active") return;

    // Speech-driven position change requests.
    const newEvents = events.slice(lastSpeechIndex.current);
    for (const event of newEvents) {
      if (event.type === "POSITION_CHANGE_REQUEST") {
        emitEvent("POSITION_CHANGE");
      }
    }
    lastSpeechIndex.current = events.length;
  }, [events, status, emitEvent]);

  useEffect(() => {
    if (status !== "active") return;
    if (lastRhythm.current === null) {
      lastRhythm.current = rhythmActive;
      return;
    }
    if (lastRhythm.current && !rhythmActive) {
      emitEvent("POSITION_CHANGE");
    }
    lastRhythm.current = rhythmActive;
  }, [rhythmActive, status, emitEvent]);
}
