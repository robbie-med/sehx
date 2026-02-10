import type { Event, EventType } from "@sexmetrics/core";
import type { SessionStatus } from "./types";

type PositionInput = {
  status: SessionStatus;
  events: Event[];
  rhythmActive: boolean;
};

type PositionInference = {
  update: (input: PositionInput) => EventType[];
  reset: () => void;
};

export function createPositionInference(): PositionInference {
  let lastSpeechIndex = 0;
  let lastRhythm: boolean | null = null;

  const reset = () => {
    lastSpeechIndex = 0;
    lastRhythm = null;
  };

  const update = ({ status, events, rhythmActive }: PositionInput) => {
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
      return outputs;
    }

    if (lastRhythm && !rhythmActive) {
      outputs.push("POSITION_CHANGE");
    }
    lastRhythm = rhythmActive;

    return outputs;
  };

  return { update, reset };
}
