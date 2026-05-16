export const EVENT_LABELS: Record<string, string> = {
  SESSION_START:           "Session started",
  SESSION_END:             "Session ended",
  SESSION_PAUSE:           "Paused",
  SESSION_RESUME:          "Resumed",
  PHASE_START_FOREPLAY:    "Foreplay began",
  PHASE_END_FOREPLAY:      "Foreplay ended",
  PHASE_START_INTERCOURSE: "Intercourse began",
  PHASE_START_COOLDOWN:    "Cooldown began",
  STOP:                    "Stop signal",
  GO:                      "Go signal",
  POSITIVE_FEEDBACK:       "Positive feedback",
  NEGATIVE_FEEDBACK:       "Negative feedback",
  POSITION_CHANGE_REQUEST: "Position change requested",
  PACE_CHANGE_REQUEST:     "Pace change requested",
  POSITION_CHANGE:         "Position changed",
  RHYTHM_START:            "Rhythm detected",
  RHYTHM_STOP:             "Rhythm stopped",
  ORGASM_EVENT:            "Orgasm detected",
};

export function labelForEvent(type: string): string {
  return EVENT_LABELS[type] ?? type;
}

export const METRIC_LABELS: Record<string, string> = {
  communication_density:        "Communication",
  foreplay_ratio:               "Foreplay",
  rhythm_continuity:            "Rhythm",
  orgasm_presence:              "Orgasm",
  stop_latency:                 "Responsiveness",
  "session.duration":           "Duration",
  "phase.foreplay.percent":     "Foreplay %",
  "event.count.orgasm":         "Orgasms",
  "event.count.stop":           "Stop signals",
  "event.count.position_change":"Position changes",
  "stop.latency.mean":          "Avg stop latency",
  "event.density.per_min":      "Events / min",
};

export function labelForMetric(key: string): string {
  return METRIC_LABELS[key] ?? key;
}
