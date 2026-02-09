import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WhisperAdapter, parseIntent, shouldRunWindow } from "@sexmetrics/asr";
import type { EventType } from "@sexmetrics/core";

const WINDOW_SECONDS = 10;
const STEP_SECONDS = 2.5;
const SPEECH_RMS_THRESHOLD = 0.015;

type AsrState = {
  ready: boolean;
  lastTranscript: string;
  events: EventType[];
  error?: string;
};

export function useAsr(
  active: boolean,
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
  const adapterRef = useRef<WhisperAdapter | null>(null);
  const lastRunRef = useRef(0);
  const lastSilenceRef = useRef<boolean>(false);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        if (!modelReady) return;
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
  }, [modelReady, modelUrl]);

  const runTranscription = useCallback(async () => {
    if (!adapterRef.current) return;
    const window = getWindow();
    if (!window || window.samples.length === 0) return;
    try {
      const result = await adapterRef.current.transcribe(
        window.samples,
        window.sampleRate
      );
      const intents = parseIntent(result.text);
      setState({ ready: true, lastTranscript: "", events: intents });
    } catch (err) {
      const message = err instanceof Error ? err.message : "ASR failed.";
      setState((prev) => ({ ...prev, error: message }));
    }
  }, [getWindow]);

  useEffect(() => {
    if (!active) return;
    const now = Date.now();
    const silenceEdge = lastSilenceRef.current && !silenceActive;
    lastSilenceRef.current = silenceActive;
    if (
      !shouldRunWindow(lastRunRef.current, now, {
        windowSeconds: WINDOW_SECONDS,
        stepSeconds: STEP_SECONDS
      })
    ) {
      if (!silenceEdge) return;
    }
    if (rms < SPEECH_RMS_THRESHOLD && !silenceEdge) return;
    lastRunRef.current = now;
    runTranscription();
  }, [active, rms, silenceActive, runTranscription]);

  const clearEvents = useCallback(() => {
    setState((prev) => ({ ...prev, events: [] }));
  }, []);

  return useMemo(() => ({ ...state, clearEvents }), [state, clearEvents]);
}
