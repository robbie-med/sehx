import { useCallback, useRef, useState } from "react";
import {
  createMotionCaptureState,
  requestMotionPermission,
  startMotionCapture,
  type MotionPermissionState
} from "@sexmetrics/capture";

export type MotionState = {
  active: boolean;
  supported: boolean;
  permission: MotionPermissionState;
  magnitude: number;
};

export function useMotionCapture() {
  const [state, setState] = useState<MotionState>(() => {
    const initial = createMotionCaptureState();
    return {
      active: initial.active,
      supported: initial.supported,
      permission: initial.permission,
      magnitude: initial.magnitude
    };
  });
  const captureRef = useRef(createMotionCaptureState());
  const stopRef = useRef<(() => void) | null>(null);

  const requestPermission = useCallback(async () => {
    const result = await requestMotionPermission();
    captureRef.current.permission = result;
    setState((prev) => ({ ...prev, permission: result }));
    return result;
  }, []);

  const start = useCallback(() => {
    if (stopRef.current) return;
    if (!captureRef.current.supported) return;
    if (captureRef.current.permission !== "granted") return;
    stopRef.current = startMotionCapture(captureRef.current, {
      onSample: (magnitude) => {
        setState((prev) => ({ ...prev, magnitude }));
      }
    }) ?? null;
    setState((prev) => ({ ...prev, active: true }));
  }, []);

  const stop = useCallback(() => {
    if (stopRef.current) {
      stopRef.current();
      stopRef.current = null;
    }
    setState((prev) => ({ ...prev, active: false }));
  }, []);

  return {
    state,
    requestPermission,
    start,
    stop
  };
}
