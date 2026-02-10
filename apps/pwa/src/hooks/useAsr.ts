import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WhisperAdapter, parseIntent, shouldRunWindow } from "@sexmetrics/asr";
import type { EventType } from "@sexmetrics/core";

const DEFAULT_WINDOW_SECONDS = 10;
const DEFAULT_STEP_SECONDS = 2.5;
const LOW_POWER_WINDOW_SECONDS = 6;
const LOW_POWER_STEP_SECONDS = 4;
const SPEECH_RMS_THRESHOLD = 0.015;

type AsrState = {
  ready: boolean;
  lastTranscript: string;
  events: EventType[];
  error?: string;
};

type AsrProfile = {
  windowSeconds: number;
  stepSeconds: number;
  lowPower: boolean;
};

function detectLowPowerProfile(): AsrProfile {
  const memory = (navigator as Navigator & { deviceMemory?: number })
    .deviceMemory;
  const cores = navigator.hardwareConcurrency ?? 4;
  const ua = navigator.userAgent ?? "";
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
    .connection;
  const saveData = connection?.saveData ?? false;
  const lowPower = isMobile || (memory ? memory <= 4 : false) || cores <= 4 || saveData;
  return {
    lowPower,
    windowSeconds: lowPower ? LOW_POWER_WINDOW_SECONDS : DEFAULT_WINDOW_SECONDS,
    stepSeconds: lowPower ? LOW_POWER_STEP_SECONDS : DEFAULT_STEP_SECONDS
  };
}

export function useAsr(
  enabled: boolean,
  micActive: boolean,
  rms: number,
  getWindow: () => { samples: Float32Array; sampleRate: number } | null,
  modelReady: boolean,
  modelUrl: string,
  silenceActive: boolean
) {
  const [state, setState] = useState<AsrState>({
    ready: false,
    lastTranscript: "",
    events: []
  });
  const profileRef = useRef<AsrProfile>(detectLowPowerProfile());
  const adapterRef = useRef<WhisperAdapter | null>(null);
  const lastRunRef = useRef(0);
  const lastSilenceRef = useRef<boolean>(false);
  const lastIntentAt = useRef<Record<EventType, number>>({});

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        if (!enabled || !modelReady) return;
        if (!adapterRef.current) adapterRef.current = new WhisperAdapter();
        await adapterRef.current.init(modelUrl);
        if (mounted) setState((prev) => ({ ...prev, ready: true }));
      } catch (err) {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : "ASR init failed.";
        setState((prev) => ({ ...prev, error: message }));
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, [enabled, modelReady, modelUrl]);

  useEffect(() => {
    if (enabled) return;
    if (!adapterRef.current) return;
    adapterRef.current.dispose().catch(() => {});
    adapterRef.current = null;
    setState((prev) => ({ ...prev, ready: false }));
  }, [enabled]);

  const runTranscription = useCallback(async () => {
    if (!adapterRef.current) return;
    const window = getWindow();
    if (!window || window.samples.length === 0) return;
    try {
      const result = await adapterRef.current.transcribe(
        window.samples,
        window.sampleRate
      );
      const now = Date.now();
      const intents = parseIntent(result.text);
      const dedupeWindowMs = profileRef.current.windowSeconds * 1000;
      const nextEvents: EventType[] = [];
      for (const intent of intents) {
        const lastAt = lastIntentAt.current[intent.type] ?? 0;
        if (now - lastAt < dedupeWindowMs) continue;
        lastIntentAt.current[intent.type] = now;
        nextEvents.push(intent.type);
      }
      setState({ ready: true, lastTranscript: "", events: nextEvents });
    } catch (err) {
      const message = err instanceof Error ? err.message : "ASR failed.";
      setState((prev) => ({ ...prev, error: message }));
    }
  }, [getWindow]);

  useEffect(() => {
    if (!enabled || !micActive) return;
    const now = Date.now();
    const silenceEdge = lastSilenceRef.current && !silenceActive;
    lastSilenceRef.current = silenceActive;
    if (
      !shouldRunWindow(lastRunRef.current, now, {
        windowSeconds: profileRef.current.windowSeconds,
        stepSeconds: profileRef.current.stepSeconds
      })
    ) {
      if (!silenceEdge) return;
    }
    if (profileRef.current.lowPower && document.visibilityState !== "visible") {
      return;
    }
    if (rms < SPEECH_RMS_THRESHOLD && !silenceEdge) return;
    lastRunRef.current = now;
    runTranscription();
  }, [enabled, micActive, rms, silenceActive, runTranscription]);

  const clearEvents = useCallback(() => {
    setState((prev) => ({ ...prev, events: [] }));
  }, []);

  return useMemo(() => ({ ...state, clearEvents }), [state, clearEvents]);
}
