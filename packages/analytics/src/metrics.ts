import type { Event } from "@sexmetrics/core";

export type MetricResult = {
  key: string;
  value: number;
};

export function computeMetrics(events: Event[]): MetricResult[] {
  const metrics: MetricResult[] = [];
  if (!events.length) return metrics;

  const sorted = [...events].sort((a, b) => a.t - b.t);
  const duration = sorted[sorted.length - 1].t;

  metrics.push({ key: "session.duration", value: duration });
  metrics.push({ key: "event.count.stop", value: countByType(sorted, "STOP") });
  metrics.push({
    key: "event.count.position_change",
    value: countByType(sorted, "POSITION_CHANGE")
  });
  metrics.push({
    key: "event.count.positive",
    value: countByType(sorted, "POSITIVE_FEEDBACK")
  });
  metrics.push({
    key: "event.count.negative",
    value: countByType(sorted, "NEGATIVE_FEEDBACK")
  });
  metrics.push({
    key: "event.count.orgasm",
    value: countByType(sorted, "ORGASM_EVENT")
  });

  const foreplayDuration = segmentDuration(
    sorted,
    "PHASE_START_FOREPLAY",
    "PHASE_START_INTERCOURSE"
  );
  metrics.push({ key: "phase.foreplay.duration", value: foreplayDuration });
  metrics.push({
    key: "phase.foreplay.percent",
    value: duration > 0 ? (foreplayDuration / duration) * 100 : 0
  });

  const stopLatencies = stopLatenciesSeconds(sorted);
  metrics.push({
    key: "stop.latency.mean",
    value: stopLatencies.length ? average(stopLatencies) : 0
  });
  metrics.push({
    key: "stop.latency.max",
    value: stopLatencies.length ? Math.max(...stopLatencies) : 0
  });

  const eventsPerMinute = duration > 0 ? (sorted.length / duration) * 60 : 0;
  metrics.push({ key: "event.density.per_min", value: eventsPerMinute });

  return metrics;
}

function countByType(events: Event[], type: Event["type"]) {
  return events.filter((event) => event.type === type).length;
}

function segmentDuration(events: Event[], startType: Event["type"], endType: Event["type"]) {
  const start = events.find((event) => event.type === startType);
  if (!start) return 0;
  const end = events.find((event) => event.type === endType && event.t > start.t);
  return (end?.t ?? events[events.length - 1].t) - start.t;
}

function stopLatenciesSeconds(events: Event[]) {
  const stops = events.filter((event) => event.type === "STOP");
  const resumes = events.filter((event) => event.type === "RHYTHM_START");
  const latencies: number[] = [];
  for (const stop of stops) {
    const next = resumes.find((event) => event.t > stop.t);
    if (next) latencies.push(next.t - stop.t);
  }
  return latencies;
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
