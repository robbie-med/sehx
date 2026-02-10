import type { Event, EventType } from "@sexmetrics/core";
import type { SessionStatus } from "./types";

type PositionInput = {
  status: SessionStatus;
  events: Event[];
  rhythmActive: boolean;
  rhythmStrength: number;
  nowMs: number;
};

type PositionInference = {
  update: (input: PositionInput) => EventType[];
  reset: () => void;
};

export function createPositionInference(): PositionInference {
  let lastSpeechIndex = 0;
  let lastRhythm: boolean | null = null;
  let lastStrength = 0;
  let lastChangeAt = 0;
  const CHANGE_COOLDOWN_MS = 8000;
  const STRENGTH_DELTA = 0.35;

  const reset = () => {
    lastSpeechIndex = 0;
    lastRhythm = null;
    lastStrength = 0;
    lastChangeAt = 0;
  };

  const update = ({ status, events, rhythmActive, rhythmStrength, nowMs }: PositionInput) => {
    const outputs: EventType[] = [];

    if (status !== "active") {
      return outputs;
    }

    const newEvents = events.slice(lastSpeechIndex);
    for (const event of newEvents) {
      if (event.type === "POSITION_CHANGE_REQUEST") {
        outputs.push("POSITION_CHANGE");
      }
    }
    lastSpeechIndex = events.length;

    if (lastRhythm === null) {
      lastRhythm = rhythmActive;
      lastStrength = rhythmStrength;
      return outputs;
    }

    if (lastRhythm && !rhythmActive) {
      outputs.push("POSITION_CHANGE");
    }
    lastRhythm = rhythmActive;

    const delta = Math.abs(rhythmStrength - lastStrength);
    if (delta >= STRENGTH_DELTA && nowMs - lastChangeAt > CHANGE_COOLDOWN_MS) {
      outputs.push("POSITION_CHANGE");
      lastChangeAt = nowMs;
    }
    lastStrength = rhythmStrength;

    return outputs;
  };

  return { update, reset };
}
