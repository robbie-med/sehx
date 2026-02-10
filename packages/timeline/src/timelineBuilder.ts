import type { Event, SignalPoint } from "@sexmetrics/core";
import type { TimelineBuildResult, TimelinePrimitive } from "./primitives";
import { TRACK_ORDER } from "./tracks";

export type ZoomLevel = "1m" | "5m" | "full";

const speechEvents = new Set([
  "STOP",
  "GO",
  "POSITIVE_FEEDBACK",
  "NEGATIVE_FEEDBACK",
  "POSITION_CHANGE_REQUEST",
  "PACE_CHANGE_REQUEST"
]);

export function buildTimeline(
  events: Event[],
  signals: SignalPoint[] = [],
  zoom: ZoomLevel = "full"
): TimelineBuildResult {
  const ordered = [...events].sort((a, b) => a.t - b.t);
  const duration = ordered.length ? ordered[ordered.length - 1].t : 0;
  const windowed = applyZoom(ordered, duration, zoom);

  const primitives: TimelinePrimitive[] = [];
  const sessionStart = windowed.find((e) => e.type === "SESSION_START");
  const sessionEnd = windowed.find((e) => e.type === "SESSION_END");

  if (sessionStart) {
    primitives.push({
      id: `session-${sessionStart.id}`,
      track: "session",
      kind: "segment",
      tStart: 0,
      tEnd: sessionEnd?.t ?? duration,
      label: "Session"
    });
  }

  const phaseSegments = buildPhaseSegments(windowed, duration);
  primitives.push(...phaseSegments);

  const positionSegments = buildPositionSegments(windowed, duration);
  primitives.push(...positionSegments);

  for (const event of windowed) {
    if (speechEvents.has(event.type)) {
      primitives.push({
        id: `speech-${event.id}`,
        track: "speech",
        kind: "marker",
        tStart: event.t,
        label: event.type,
        payload: { eventId: event.id }
      });
    }
    if (event.type === "ORGASM_EVENT") {
      primitives.push({
        id: `orgasm-${event.id}`,
        track: "orgasm",
        kind: "marker",
        tStart: event.t,
        label: "ORGASM",
        payload: { eventId: event.id }
      });
    }
  }

  const rhythmSegments = buildRhythmSegments(windowed, duration);
  primitives.push(...rhythmSegments);

  const silenceSegments = buildSilenceSegments(windowed, signals, duration);
  primitives.push(...silenceSegments);

  const signalPrimitives = buildSignalPrimitives(signals, duration);
  primitives.push(...signalPrimitives);

  primitives.sort((a, b) => {
    const trackDiff =
      TRACK_ORDER.indexOf(a.track) - TRACK_ORDER.indexOf(b.track);
    if (trackDiff !== 0) return trackDiff;
    return a.tStart - b.tStart;
  });

  return { duration, primitives };
}

function applyZoom(events: Event[], duration: number, zoom: ZoomLevel) {
  if (zoom === "full") return events;
  const windowSeconds = zoom === "1m" ? 60 : 300;
  const start = Math.max(0, duration - windowSeconds);
  return events.filter((event) => event.t >= start);
}

function buildPhaseSegments(events: Event[], duration: number) {
  const segments: TimelinePrimitive[] = [];
  const phases = [
    { start: "PHASE_START_FOREPLAY", label: "Foreplay" },
    { start: "PHASE_START_INTERCOURSE", label: "Intercourse" },
    { start: "PHASE_START_COOLDOWN", label: "Cooldown" }
  ] as const;

  for (let i = 0; i < phases.length; i += 1) {
    const phase = phases[i];
    const startEvent = events.find((event) => event.type === phase.start);
    if (!startEvent) continue;
    const endEvent = events.find(
      (event) => event.t > startEvent.t && event.type.startsWith("PHASE_START")
    );
    segments.push({
      id: `phase-${phase.start}-${startEvent.id}`,
      track: "phases",
      kind: "segment",
      tStart: startEvent.t,
      tEnd: endEvent?.t ?? duration,
      label: phase.label
    });
  }

  return segments;
}

function buildPositionSegments(events: Event[], duration: number) {
  const segments: TimelinePrimitive[] = [];
  const positions = events.filter((event) => event.type === "POSITION_CHANGE");
  let lastStart = 0;
  let index = 1;

  for (const event of positions) {
    segments.push({
      id: `position-${index}`,
      track: "positions",
      kind: "segment",
      tStart: lastStart,
      tEnd: event.t,
      label: `Position ${index}`
    });
    lastStart = event.t;
    index += 1;
  }

  if (duration > lastStart) {
    segments.push({
      id: `position-${index}`,
      track: "positions",
      kind: "segment",
      tStart: lastStart,
      tEnd: duration,
      label: `Position ${index}`
    });
  }

  return segments;
}

function buildRhythmSegments(events: Event[], duration: number) {
  const segments: TimelinePrimitive[] = [];
  let currentStart: number | null = null;
  for (const event of events) {
    if (event.type === "RHYTHM_START") {
      currentStart = event.t;
    }
    if (event.type === "RHYTHM_STOP" && currentStart !== null) {
      segments.push({
        id: `rhythm-${event.id}`,
        track: "rhythm",
        kind: "segment",
        tStart: currentStart,
        tEnd: event.t,
        label: "Rhythm"
      });
      currentStart = null;
    }
  }
  if (currentStart !== null) {
    segments.push({
      id: `rhythm-open`,
      track: "rhythm",
      kind: "segment",
      tStart: currentStart,
      tEnd: duration,
      label: "Rhythm"
    });
  }
  return segments;
}

function buildSilenceSegments(
  events: Event[],
  signals: SignalPoint[],
  duration: number
) {
  const silencePoints = signals
    .filter((point) => point.type === "silence")
    .sort((a, b) => a.t - b.t);

  if (silencePoints.length) {
    const segments: TimelinePrimitive[] = [];
    let currentStart: number | null = null;
    let lastT = silencePoints[0].t;
    const gapThreshold = 2;

    for (const point of silencePoints) {
      const isSilent = point.value >= 0.5;
      const gap = point.t - lastT;
      if (currentStart === null && isSilent) {
        currentStart = point.t;
      } else if (currentStart !== null) {
        if (!isSilent || gap > gapThreshold) {
          segments.push({
            id: `silence-${currentStart}-${point.t}`,
            track: "silence",
            kind: "segment",
            tStart: currentStart,
            tEnd: point.t,
            label: "Silence"
          });
          currentStart = isSilent ? point.t : null;
        }
      }
      lastT = point.t;
    }

    if (currentStart !== null) {
      segments.push({
        id: `silence-open`,
        track: "silence",
        kind: "segment",
        tStart: currentStart,
        tEnd: duration,
        label: "Silence"
      });
    }
    return segments;
  }

  const segments: TimelinePrimitive[] = [];
  let currentStart: number | null = null;
  for (const event of events) {
    if (event.type === "RHYTHM_STOP") {
      currentStart = event.t;
    }
    if (event.type === "RHYTHM_START" && currentStart !== null) {
      segments.push({
        id: `silence-${event.id}`,
        track: "silence",
        kind: "segment",
        tStart: currentStart,
        tEnd: event.t,
        label: "Silence"
      });
      currentStart = null;
    }
  }
  if (currentStart !== null) {
    segments.push({
      id: `silence-open`,
      track: "silence",
      kind: "segment",
      tStart: currentStart,
      tEnd: duration,
      label: "Silence"
    });
  }
  return segments;
}

function buildSignalPrimitives(signals: SignalPoint[], duration: number) {
  if (!signals.length) return [];
  const signalsByType = new Map<string, SignalPoint[]>();
  for (const signal of signals) {
    if (!signalsByType.has(signal.type)) {
      signalsByType.set(signal.type, []);
    }
    signalsByType.get(signal.type)?.push(signal);
  }
  const primitives: TimelinePrimitive[] = [];
  for (const [type, points] of signalsByType.entries()) {
    const track =
      type === "intensity"
        ? "intensity"
        : type === "rhythm"
        ? "rhythm"
        : type === "silence"
        ? "silence"
        : "intensity";
    primitives.push({
      id: `series-${type}`,
      track,
      kind: "series",
      tStart: 0,
      tEnd: duration,
      label: type,
      payload: { points }
    });
  }
  return primitives;
}
