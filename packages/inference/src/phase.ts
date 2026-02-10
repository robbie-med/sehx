import type { EventType } from "@sexmetrics/core";
import type { SessionStatus } from "./types";

type PhaseState = "none" | "foreplay" | "intercourse" | "cooldown";

type PhaseInput = {
  status: SessionStatus;
  rhythmActive: boolean;
};

type PhaseInference = {
  update: (input: PhaseInput) => EventType[];
  reset: () => void;
};

export function createPhaseInference(): PhaseInference {
  let phase: PhaseState = "none";
  let lastStatus: SessionStatus = "idle";

  const reset = () => {
    phase = "none";
    lastStatus = "idle";
  };

  const update = ({ status, rhythmActive }: PhaseInput) => {
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
      if (rhythmActive && phase === "foreplay") {
        phase = "intercourse";
        events.push("PHASE_END_FOREPLAY", "PHASE_START_INTERCOURSE");
      }
      if (!rhythmActive && phase === "intercourse") {
        phase = "cooldown";
        events.push("PHASE_START_COOLDOWN");
      }
    }

    lastStatus = status;
    return events;
  };

  return { update, reset };
}
