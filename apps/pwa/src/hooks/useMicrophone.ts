import { useCallback, useRef, useState } from "react";
import type { MicCaptureState } from "@sexmetrics/capture";
import {
  startMicCapture,
  stopMicCapture,
  clearRingBuffer,
  createRingBuffer,
  readRingBuffer,
  writeToRingBuffer
} from "@sexmetrics/capture";
import { computeRms } from "@sexmetrics/dsp";

export function useMicrophone() {
  const [active, setActive] = useState(false);
  const [rms, setRms] = useState(0);
  const captureRef = useRef<MicCaptureState | null>(null);
  const bufferRef = useRef<ReturnType<typeof createRingBuffer> | null>(null);
  const sampleRateRef = useRef<number | null>(null);
  const rmsTimer = useRef<number | null>(null);

  const start = useCallback(async () => {
    if (captureRef.current) return;
    const capture = await startMicCapture({
      onAudioFrame: (samples, sampleRate) => {
        if (!bufferRef.current) {
          bufferRef.current = createRingBuffer(10, sampleRate);
          sampleRateRef.current = sampleRate;
        }
        writeToRingBuffer(bufferRef.current, samples);
      }
    });
    captureRef.current = capture;
    setActive(true);

    if (rmsTimer.current) window.clearInterval(rmsTimer.current);
    rmsTimer.current = window.setInterval(() => {
      const buf = bufferRef.current;
      if (!buf) return;
      const windowSize = Math.min(2048, buf.capacity);
      const end = buf.writeIndex;
      const startIdx = Math.max(0, end - windowSize);
      if (!buf.filled && end === 0) {
        setRms(0);
        return;
      }
      if (startIdx < end) {
        const slice = buf.data.subarray(startIdx, end);
        setRms(computeRms(slice));
        return;
      }
      if (buf.filled) {
        const tail = buf.data.subarray(startIdx);
        const head = buf.data.subarray(0, end);
        const merged = new Float32Array(tail.length + head.length);
        merged.set(tail);
        merged.set(head, tail.length);
        setRms(computeRms(merged));
        return;
      }
      const slice = buf.data.subarray(0, end);
      setRms(computeRms(slice));
    }, 500);
  }, []);

  const stop = useCallback(async () => {
    if (!captureRef.current) return;
    await stopMicCapture(captureRef.current);
    captureRef.current = null;
    setActive(false);
    if (bufferRef.current) {
      clearRingBuffer(bufferRef.current);
    }
    sampleRateRef.current = null;
    if (rmsTimer.current) {
      window.clearInterval(rmsTimer.current);
      rmsTimer.current = null;
    }
  }, []);

  const getWindow = useCallback(() => {
    if (!bufferRef.current || !sampleRateRef.current) return null;
    return {
      samples: readRingBuffer(bufferRef.current),
      sampleRate: sampleRateRef.current
    };
  }, []);

  return { active, rms, start, stop, getWindow };
}
