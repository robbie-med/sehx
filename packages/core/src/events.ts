export const EVENT_TYPES = [
  "SESSION_START",
  "SESSION_END",
  "SESSION_PAUSE",
  "SESSION_RESUME",
  "PHASE_START_FOREPLAY",
  "PHASE_END_FOREPLAY",
  "PHASE_START_INTERCOURSE",
  "PHASE_START_COOLDOWN",
  "STOP",
  "GO",
  "POSITIVE_FEEDBACK",
  "NEGATIVE_FEEDBACK",
  "POSITION_CHANGE_REQUEST",
  "PACE_CHANGE_REQUEST",
  "POSITION_CHANGE",
  "RHYTHM_START",
  "RHYTHM_STOP",
  "ORGASM_EVENT"
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export type EventSource = "audio" | "speech" | "motion" | "inference" | "user";

export type Event = Readonly<{
  id: string;
  sessionId: string;
  t: number;
  type: EventType;
  source: EventSource;
  confidence: number;
  payload?: Record<string, unknown>;
}>;
