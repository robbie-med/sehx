import { useEffect, useMemo, useRef, useState } from "react";
import { computeRhythmStrength, isSilence } from "@sexmetrics/dsp";

type RhythmSnapshot = {
  active: boolean;
  strength: number;
};

type SignalState = {
  silenceActive: boolean;
  silenceSeconds: number;
  rhythm: RhythmSnapshot;
};

type Sample = {
  t: number;
  v: number;
};

const SILENCE_THRESHOLD = 0.01;
const SILENCE_MIN_SECONDS = 2;
const RHYTHM_WINDOW_MS = 4000;
const RHYTHM_STRENGTH_THRESHOLD = 0.35;

export function useSignalDetection(rms: number, active: boolean) {
  const [state, setState] = useState<SignalState>({
    silenceActive: false,
    silenceSeconds: 0,
    rhythm: { active: false, strength: 0 }
  });
  const silenceStart = useRef<number | null>(null);
  const samples = useRef<Sample[]>([]);

  useEffect(() => {
    if (!active) {
      silenceStart.current = null;
      samples.current = [];
      setState({
        silenceActive: false,
        silenceSeconds: 0,
        rhythm: { active: false, strength: 0 }
      });
      return;
    }

    const now = Date.now();
    if (isSilence(rms, SILENCE_THRESHOLD)) {
      if (!silenceStart.current) silenceStart.current = now;
      const silenceSeconds = (now - silenceStart.current) / 1000;
      setState((prev) => ({
        ...prev,
        silenceActive: silenceSeconds >= SILENCE_MIN_SECONDS,
        silenceSeconds
      }));
    } else {
      silenceStart.current = null;
      setState((prev) => ({ ...prev, silenceActive: false, silenceSeconds: 0 }));
    }

    samples.current.push({ t: now, v: rms });
    const cutoff = now - RHYTHM_WINDOW_MS;
    samples.current = samples.current.filter((s) => s.t >= cutoff);

    const points = samples.current;
    let strength = 0;
    if (points.length >= 4) {
      const durationSeconds = (points[points.length - 1].t - points[0].t) / 1000;
      const sampleRateHz = durationSeconds > 0 ? (points.length - 1) / durationSeconds : 0;
      const values = points.map((point) => point.v);
      strength = computeRhythmStrength(values, sampleRateHz).strength;
    }
    setState((prev) => ({
      ...prev,
      rhythm: {
        active: strength >= RHYTHM_STRENGTH_THRESHOLD,
        strength
      }
    }));
  }, [rms, active]);

  return useMemo(() => state, [state]);
}
