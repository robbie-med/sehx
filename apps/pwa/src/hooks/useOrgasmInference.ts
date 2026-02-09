import { useEffect, useRef } from "react";

type SessionStatus = "idle" | "active" | "paused" | "ended";

export function useOrgasmInference(
  status: SessionStatus,
  rms: number,
  rhythmStrength: number,
  silenceActive: boolean,
  emitEvent: (type: "ORGASM_EVENT") => void
) {
  const spikeRef = useRef<number | null>(null);
  const lastEmit = useRef<number>(0);
  const lastRms = useRef<number>(0);

  useEffect(() => {
    if (status !== "active") return;
    const now = Date.now();
    const delta = rms - lastRms.current;
    lastRms.current = rms;

    const spike = delta > 0.02 && rms > 0.05 && rhythmStrength > 0.4;
    if (spike) {
      spikeRef.current = now;
    }

    const cooldownMs = 60_000;
    if (
      spikeRef.current &&
      silenceActive &&
      now - spikeRef.current < 12_000 &&
      now - lastEmit.current > cooldownMs
    ) {
      lastEmit.current = now;
      spikeRef.current = null;
      emitEvent("ORGASM_EVENT");
    }
  }, [status, rms, rhythmStrength, silenceActive, emitEvent]);
}
