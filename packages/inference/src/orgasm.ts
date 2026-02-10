import type { EventType } from "@sexmetrics/core";
import type { SessionStatus } from "./types";

type OrgasmInput = {
  status: SessionStatus;
  rms: number;
  rhythmStrength: number;
  silenceActive: boolean;
  nowMs: number;
};

type OrgasmInference = {
  update: (input: OrgasmInput) => EventType[];
  reset: () => void;
};

export function createOrgasmInference(): OrgasmInference {
  let spikeAt: number | null = null;
  let lastEmit = 0;
  let lastRms = 0;

  const reset = () => {
    spikeAt = null;
    lastEmit = 0;
    lastRms = 0;
  };

  const update = ({ status, rms, rhythmStrength, silenceActive, nowMs }: OrgasmInput) => {
    const outputs: EventType[] = [];

    if (status !== "active") {
      return outputs;
    }

    const delta = rms - lastRms;
    lastRms = rms;

    const spike = delta > 0.02 && rms > 0.05 && rhythmStrength > 0.4;
    if (spike) {
      spikeAt = nowMs;
    }

    const cooldownMs = 60_000;
    if (
      spikeAt &&
      silenceActive &&
      nowMs - spikeAt < 12_000 &&
      nowMs - lastEmit > cooldownMs
    ) {
      lastEmit = nowMs;
      spikeAt = null;
      outputs.push("ORGASM_EVENT");
    }

    return outputs;
  };

  return { update, reset };
}
