import { useEffect, useMemo, useRef, useState } from "react";
import { isSilence } from "@sexmetrics/dsp";

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
const RHYTHM_THRESHOLD = 0.02;
const RHYTHM_WINDOW_MS = 4000;
const RHYTHM_MIN_PEAKS = 3;

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

    const peaks = countPeaks(samples.current, RHYTHM_THRESHOLD);
    const strength = Math.min(1, peaks / RHYTHM_MIN_PEAKS);
    setState((prev) => ({
      ...prev,
      rhythm: {
        active: peaks >= RHYTHM_MIN_PEAKS,
        strength
      }
    }));
  }, [rms, active]);

  return useMemo(() => state, [state]);
}

function countPeaks(window: Sample[], threshold: number) {
  if (window.length < 3) return 0;
  let peaks = 0;
  for (let i = 1; i < window.length - 1; i += 1) {
    const prev = window[i - 1].v;
    const curr = window[i].v;
    const next = window[i + 1].v;
    if (curr > threshold && curr > prev && curr > next) {
      peaks += 1;
      i += 1;
    }
  }
  return peaks;
}
