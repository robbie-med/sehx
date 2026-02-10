import type { Event } from "@sexmetrics/core";

export type ScoreComponent = {
  key: string;
  weight: number;
  raw: number;
  score: number;
};

export type ScoreResult = {
  total: number;
  components: ScoreComponent[];
};

export function computeScore(events: Event[]): ScoreResult {
  const components: ScoreComponent[] = [];
  if (!events.length) return { total: 0, components };

  const duration = events[events.length - 1].t || 0;

  const commDensity = normalize(
    countTypes(events, ["STOP", "GO", "POSITIVE_FEEDBACK", "NEGATIVE_FEEDBACK"]) /
      Math.max(duration, 1)
  );
  components.push(makeComponent("communication_density", 0.2, commDensity));

  const foreplayRatio = phaseRatio(
    events,
    "PHASE_START_FOREPLAY",
    "PHASE_START_INTERCOURSE",
    duration
  );
  components.push(makeComponent("foreplay_ratio", 0.2, foreplayRatio));

  const rhythmContinuity = rhythmContinuityIndex(events, duration);
  components.push(makeComponent("rhythm_continuity", 0.2, rhythmContinuity));

  const orgasmPresence = normalize(countTypes(events, ["ORGASM_EVENT"]));
  components.push(makeComponent("orgasm_presence", 0.2, orgasmPresence));

  const stopLatency = stopLatencyIndex(events);
  components.push(makeComponent("stop_latency", 0.2, stopLatency));

  const total = components.reduce((sum, c) => sum + c.score * c.weight, 0) * 100;

  return {
    total: Math.max(0, Math.min(100, total)),
    components
  };
}

function makeComponent(key: string, weight: number, raw: number): ScoreComponent {
  const score = Math.max(0, Math.min(1, raw));
  return { key, weight, raw, score };
}

function countTypes(events: Event[], types: Event["type"][]) {
  return events.filter((event) => types.includes(event.type)).length;
}

function normalize(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function phaseRatio(
  events: Event[],
  startType: Event["type"],
  endType: Event["type"],
  duration: number
) {
  const start = events.find((event) => event.type === startType);
  if (!start) return 0;
  const end = events.find((event) => event.type === endType && event.t > start.t);
  const segment = (end?.t ?? duration) - start.t;
  return duration > 0 ? segment / duration : 0;
}

function rhythmContinuityIndex(events: Event[], duration: number) {
  if (!duration) return 0;
  let total = 0;
  let current: number | null = null;
  for (const event of events) {
    if (event.type === "RHYTHM_START") current = event.t;
    if (event.type === "RHYTHM_STOP" && current !== null) {
      total += event.t - current;
      current = null;
    }
  }
  if (current !== null) total += duration - current;
  return total / duration;
}

function stopLatencyIndex(events: Event[]) {
  const stops = events.filter((event) => event.type === "STOP");
  const resumes = events.filter((event) => event.type === "RHYTHM_START");
  if (!stops.length) return 1;
  const latencies: number[] = [];
  for (const stop of stops) {
    const next = resumes.find((event) => event.t > stop.t);
    if (next) latencies.push(next.t - stop.t);
  }
  if (!latencies.length) return 0;
  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  return 1 - Math.min(1, avg / 30);
}
