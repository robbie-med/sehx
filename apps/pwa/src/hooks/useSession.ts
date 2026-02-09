import { useEffect, useMemo, useState } from "react";
import type { Event } from "@sexmetrics/core";
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

const SESSION_KEY = "sm_session_state_v1";
const EVENTS_KEY = "sm_session_events_v1";

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

function loadState(): SessionState {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return emptyState;
    const parsed = JSON.parse(raw) as SessionState;
    return { ...emptyState, ...parsed };
  } catch {
    return emptyState;
  }
}

function loadEvents(): Event[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Event[];
  } catch {
    return [];
  }
}

function persistState(state: SessionState) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(state));
}

function persistEvents(events: Event[]) {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

export function useSession() {
  const [state, setState] = useState<SessionState>(emptyState);
  const [events, setEvents] = useState<Event[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setState(loadState());
    setEvents(loadEvents());
  }, []);

  useEffect(() => {
    persistState(state);
  }, [state]);

  useEffect(() => {
    persistEvents(events);
  }, [events]);

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
    getElapsedNow
  };
}
