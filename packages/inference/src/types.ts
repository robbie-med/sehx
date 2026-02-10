export type SessionStatus = "idle" | "active" | "paused" | "ended";

export type InferenceEvent = {
  type: import("@sexmetrics/core").EventType;
  confidence?: number;
  payload?: Record<string, unknown>;
};
