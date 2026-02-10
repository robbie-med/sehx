import type { EventType } from "@sexmetrics/core";
import type { SessionStatus } from "./types";

type PhaseState = "none" | "foreplay" | "intercourse" | "cooldown";

type PhaseInput = {
  status: SessionStatus;
  rhythmActive: boolean;
  nowMs: number;
};

type PhaseInference = {
  update: (input: PhaseInput) => EventType[];
  reset: () => void;
};

export function createPhaseInference(): PhaseInference {
  let phase: PhaseState = "none";
  let lastStatus: SessionStatus = "idle";
  let rhythmStartedAt: number | null = null;
  let rhythmStoppedAt: number | null = null;
  const RHYTHM_ONSET_MS = 4000;
  const RHYTHM_OFFSET_MS = 4000;

  const reset = () => {
    phase = "none";
    lastStatus = "idle";
    rhythmStartedAt = null;
    rhythmStoppedAt = null;
  };

  const update = ({ status, rhythmActive, nowMs }: PhaseInput) => {
    const events: EventType[] = [];

    if (status === "active" && lastStatus !== "active") {
      if (phase === "none") {
        phase = "foreplay";
        events.push("PHASE_START_FOREPLAY");
      }
    }

    if (status === "ended" && lastStatus !== "ended") {
      if (phase !== "cooldown") {
        phase = "cooldown";
        events.push("PHASE_START_COOLDOWN");
      }
    }

    if (status === "active") {
      if (rhythmActive) {
        if (!rhythmStartedAt) rhythmStartedAt = nowMs;
        rhythmStoppedAt = null;
        if (phase === "foreplay" && nowMs - rhythmStartedAt >= RHYTHM_ONSET_MS) {
          phase = "intercourse";
          events.push("PHASE_END_FOREPLAY", "PHASE_START_INTERCOURSE");
        }
      } else {
        if (!rhythmStoppedAt) rhythmStoppedAt = nowMs;
        rhythmStartedAt = null;
        if (phase === "intercourse" && nowMs - rhythmStoppedAt >= RHYTHM_OFFSET_MS) {
          phase = "cooldown";
          events.push("PHASE_START_COOLDOWN");
        }
      }
    }

    lastStatus = status;
    return events;
  };

  return { update, reset };
}
