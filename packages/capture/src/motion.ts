export type MotionPermissionState = "unknown" | "granted" | "denied" | "prompt";

export type MotionCaptureState = {
  active: boolean;
  permission: MotionPermissionState;
  supported: boolean;
  magnitude: number;
  lastUpdate?: number;
};

type MotionCallbacks = {
  onSample?: (magnitude: number) => void;
};

const DEFAULT_STATE: MotionCaptureState = {
  active: false,
  permission: "unknown",
  supported:
    typeof window !== "undefined" && typeof DeviceMotionEvent !== "undefined",
  magnitude: 0
};

function computeMagnitude(x?: number | null, y?: number | null, z?: number | null) {
  const vx = x ?? 0;
  const vy = y ?? 0;
  const vz = z ?? 0;
  return Math.sqrt(vx * vx + vy * vy + vz * vz);
}

export async function requestMotionPermission(): Promise<MotionPermissionState> {
  if (typeof DeviceMotionEvent === "undefined") return "denied";
  const request = (DeviceMotionEvent as typeof DeviceMotionEvent & {
    requestPermission?: () => Promise<"granted" | "denied">;
  }).requestPermission;
  if (typeof request !== "function") {
    return "granted";
  }
  try {
    const result = await request();
    return result === "granted" ? "granted" : "denied";
  } catch {
    return "denied";
  }
}

export function createMotionCaptureState(): MotionCaptureState {
  return { ...DEFAULT_STATE };
}

export function startMotionCapture(
  state: MotionCaptureState,
  callbacks: MotionCallbacks = {}
) {
  if (!state.supported || state.active) return;
  const handler = (event: DeviceMotionEvent) => {
    const acc = event.acceleration ?? event.accelerationIncludingGravity;
    const magnitude = computeMagnitude(acc?.x, acc?.y, acc?.z);
    const now = event.timeStamp || Date.now();
    if (state.lastUpdate && now - state.lastUpdate < 100) return;
    state.magnitude = magnitude;
    state.lastUpdate = now;
    callbacks.onSample?.(magnitude);
  };
  window.addEventListener("devicemotion", handler);
  state.active = true;
  return () => {
    window.removeEventListener("devicemotion", handler);
    state.active = false;
  };
}
