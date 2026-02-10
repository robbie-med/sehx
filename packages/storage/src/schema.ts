export const SCHEMA_VERSION = 1;

export type StoredSession = {
  id: string;
  createdAt: number;
  endedAt?: number;
  engineVersion: string;
  settingsSnapshot?: Record<string, unknown>;
  label?: string;
  rating?: number;
  status: "idle" | "active" | "paused" | "ended";
  pausedAt?: number;
  totalPausedMs: number;
  schemaVersion: number;
  updatedAt: number;
};

export type StoredEvent = {
  id: string;
  sessionId: string;
  t: number;
  type: string;
  source: string;
  confidence: number;
  payload?: Record<string, unknown>;
  schemaVersion: number;
  createdAt: number;
  updatedAt: number;
};

export type StoredSignal = {
  id: string;
  sessionId: string;
  t: number;
  type: string;
  value: number;
  schemaVersion: number;
  createdAt: number;
  updatedAt: number;
};

export type StoredMetric = {
  id: string;
  sessionId: string;
  key: string;
  value: number;
  engineVersion: string;
  schemaVersion: number;
  createdAt: number;
  updatedAt: number;
};
