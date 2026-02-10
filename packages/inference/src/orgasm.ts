import type { SessionStatus, InferenceEvent } from "./types";

type OrgasmInput = {
  status: SessionStatus;
  rms: number;
  rhythmStrength: number;
  silenceActive: boolean;
  nowMs: number;
};

type OrgasmInference = {
  update: (input: OrgasmInput) => InferenceEvent[];
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
    const outputs: InferenceEvent[] = [];

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
      const intensityScore = Math.min(1, Math.max(0, (rms - 0.05) / 0.2));
      const confidence = Math.min(1, 0.4 + rhythmStrength * 0.4 + intensityScore * 0.2);
      outputs.push({ type: "ORGASM_EVENT", confidence });
    }

    return outputs;
  };

  return { update, reset };
}
