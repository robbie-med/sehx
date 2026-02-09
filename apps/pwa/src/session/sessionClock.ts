export type ClockStatus = "idle" | "active" | "paused" | "ended";

export type ClockSnapshot = {
  status: ClockStatus;
  startedAt?: number;
  pausedAt?: number;
  endedAt?: number;
  totalPausedMs: number;
};

export const emptyClock: ClockSnapshot = {
  status: "idle",
  totalPausedMs: 0
};

export function startClock(nowMs: number) {
  return {
    status: "active" as const,
    startedAt: nowMs,
    totalPausedMs: 0
  };
}

export function pauseClock(state: ClockSnapshot, nowMs: number) {
  if (state.status !== "active" || !state.startedAt) return state;
  return { ...state, status: "paused", pausedAt: nowMs };
}

export function resumeClock(state: ClockSnapshot, nowMs: number) {
  if (state.status !== "paused" || !state.pausedAt) return state;
  const pausedDuration = nowMs - state.pausedAt;
  return {
    ...state,
    status: "active",
    pausedAt: undefined,
    totalPausedMs: state.totalPausedMs + pausedDuration
  };
}

export function endClock(state: ClockSnapshot, nowMs: number) {
  if (!state.startedAt) return state;
  let totalPausedMs = state.totalPausedMs;
  if (state.status === "paused" && state.pausedAt) {
    totalPausedMs += nowMs - state.pausedAt;
  }
  return {
    ...state,
    status: "ended",
    endedAt: nowMs,
    pausedAt: undefined,
    totalPausedMs
  };
}

export function elapsedMs(state: ClockSnapshot, nowMs: number) {
  if (!state.startedAt) return 0;
  if (state.status === "paused" && state.pausedAt) {
    return state.pausedAt - state.startedAt - state.totalPausedMs;
  }
  const end = state.status === "ended" && state.endedAt ? state.endedAt : nowMs;
  return end - state.startedAt - state.totalPausedMs;
}
