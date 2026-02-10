import { useEffect, useMemo, useState } from "react";
import type { Event } from "@sexmetrics/core";
import {
  addEvent,
  getActiveSession,
  getEventsForSession,
  deleteSession,
  upsertSession
} from "@sexmetrics/storage";
import {
  emptyClock,
  endClock,
  elapsedMs,
  pauseClock,
  resumeClock,
  startClock
} from "../session/sessionClock";

type SessionStatus = "idle" | "active" | "paused" | "ended";

type SessionState = {
  status: SessionStatus;
  sessionId?: string;
  startedAt?: number;
  pausedAt?: number;
  endedAt?: number;
  totalPausedMs: number;
};

const emptyState: SessionState = { ...emptyClock };

function nowMs() {
  return Date.now();
}

function toSeconds(ms: number) {
  return Math.max(0, ms / 1000);
}

function computeElapsedMs(state: SessionState) {
  return elapsedMs(state, nowMs());
}

async function loadState(): Promise<SessionState> {
  const active = await getActiveSession();
  if (!active) return emptyState;
  return {
    status: active.status,
    sessionId: active.id,
    startedAt: active.createdAt,
    pausedAt: active.pausedAt,
    endedAt: active.endedAt,
    totalPausedMs: active.totalPausedMs
  };
}

async function loadEvents(sessionId: string): Promise<Event[]> {
  const rows = await getEventsForSession(sessionId);
  return rows.map((event) => ({
    id: event.id,
    sessionId: event.sessionId,
    t: event.t,
    type: event.type as Event["type"],
    source: event.source as Event["source"],
    confidence: event.confidence,
    payload: event.payload
  }));
}

export function useSession() {
  const [state, setState] = useState<SessionState>(emptyState);
  const [events, setEvents] = useState<Event[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let mounted = true;
    loadState().then((loaded) => {
      if (!mounted) return;
      setState(loaded);
      if (loaded.sessionId) {
        loadEvents(loaded.sessionId).then((items) => {
          if (!mounted) return;
          setEvents(items);
        });
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!state.sessionId) return;
    upsertSession({
      id: state.sessionId,
      createdAt: state.startedAt ?? Date.now(),
      endedAt: state.endedAt,
      engineVersion: "v1",
      settingsSnapshot: {},
      status: state.status,
      pausedAt: state.pausedAt,
      totalPausedMs: state.totalPausedMs
    }).catch(() => {});
  }, [state]);

  useEffect(() => {
    if (state.status === "active") {
      const id = window.setInterval(() => setTick((t) => t + 1), 500);
      return () => window.clearInterval(id);
    }
    return undefined;
  }, [state.status]);

  const elapsedSeconds = useMemo(
    () => toSeconds(computeElapsedMs(state)),
    [state, tick]
  );

  const emitEvent = (
    type: Event["type"],
    timeMs: number,
    sessionIdOverride?: string
  ) => {
    const sessionId = sessionIdOverride ?? state.sessionId;
    if (!sessionId) return;
    const next: Event = {
      id: crypto.randomUUID(),
      sessionId,
      t: toSeconds(timeMs),
      type,
      source: "user",
      confidence: 1
    };
    setEvents((prev) => [...prev, next]);
    addEvent({
      id: next.id,
      sessionId: next.sessionId,
      t: next.t,
      type: next.type,
      source: next.source,
      confidence: next.confidence,
      payload: next.payload
    }).catch(() => {});
  };

  const startSession = () => {
    const sessionId = crypto.randomUUID();
    const startedAt = nowMs();
    const clock = startClock(startedAt);
    const next: SessionState = { ...clock, sessionId };
    setState(next);
    emitEvent("SESSION_START", 0, sessionId);
  };

  const pauseSession = () => {
    if (state.status !== "active" || !state.startedAt) return;
    const pausedAt = nowMs();
    const elapsed = elapsedMs(state, pausedAt);
    setState(pauseClock(state, pausedAt));
    emitEvent("SESSION_PAUSE", elapsed);
  };

  const resumeSession = () => {
    if (state.status !== "paused" || !state.pausedAt) return;
    const resumedAt = nowMs();
    const elapsed = elapsedMs(state, resumedAt);
    setState(resumeClock(state, resumedAt));
    emitEvent("SESSION_RESUME", elapsed);
  };

  const endSession = () => {
    if (state.status === "idle" || !state.startedAt) return;
    const endedAt = nowMs();
    const elapsed = elapsedMs(state, endedAt);
    setState(endClock(state, endedAt));
    emitEvent("SESSION_END", elapsed);
  };

  const resetSession = () => {
    setState(emptyState);
    setEvents([]);
  };

  const hardDeleteSession = async () => {
    if (!state.sessionId) return;
    await deleteSession(state.sessionId);
    setState(emptyState);
    setEvents([]);
  };

  const addEventNow = (type: Event["type"]) => {
    if (state.status === "idle" || !state.startedAt) return;
    const elapsed = elapsedMs(state, nowMs());
    emitEvent(type, elapsed);
  };

  const lastEventType = events.length ? events[events.length - 1].type : null;

  const getElapsedNow = () => {
    if (state.status === "idle" || !state.startedAt) return 0;
    return elapsedMs(state, nowMs()) / 1000;
  };

  return {
    state,
    events,
    lastEventType,
    elapsedSeconds,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    resetSession,
    addEventNow,
    getElapsedNow,
    hardDeleteSession
  };
}
