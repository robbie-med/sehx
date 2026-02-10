import { assertNoForbiddenPersistence } from "@sexmetrics/core";
import { db } from "./db";
import {
  SCHEMA_VERSION,
  type StoredEvent,
  type StoredMetric,
  type StoredSession,
  type StoredSignal
} from "./schema";

function now() {
  return Date.now();
}

export async function upsertSession(
  session: Omit<StoredSession, "schemaVersion" | "updatedAt">
) {
  const record: StoredSession = {
    ...session,
    schemaVersion: SCHEMA_VERSION,
    updatedAt: now()
  };
  assertNoForbiddenPersistence(record as Record<string, unknown>, "session");
  await db.sessions.put(record);
  return record;
}

export async function getActiveSession() {
  return db.sessions
    .where("status")
    .anyOf(["active", "paused"])
    .last();
}

export async function listSessions(limit = 50) {
  return db.sessions.orderBy("createdAt").reverse().limit(limit).toArray();
}

export async function addEvent(
  event: Omit<StoredEvent, "schemaVersion" | "createdAt" | "updatedAt">
) {
  const record: StoredEvent = {
    ...event,
    schemaVersion: SCHEMA_VERSION,
    createdAt: now(),
    updatedAt: now()
  };
  assertNoForbiddenPersistence(record as Record<string, unknown>, "event");
  await db.events.put(record);
  return record;
}

export async function getEventsForSession(sessionId: string) {
  return db.events.where("sessionId").equals(sessionId).sortBy("t");
}

export async function addSignal(
  signal: Omit<StoredSignal, "schemaVersion" | "createdAt" | "updatedAt">
) {
  const record: StoredSignal = {
    ...signal,
    schemaVersion: SCHEMA_VERSION,
    createdAt: now(),
    updatedAt: now()
  };
  assertNoForbiddenPersistence(record as Record<string, unknown>, "signal");
  await db.signals.put(record);
  return record;
}

export async function getSignalsForSession(sessionId: string) {
  return db.signals.where("sessionId").equals(sessionId).sortBy("t");
}

export async function addMetric(
  metric: Omit<StoredMetric, "schemaVersion" | "createdAt" | "updatedAt">
) {
  const record: StoredMetric = {
    ...metric,
    schemaVersion: SCHEMA_VERSION,
    createdAt: now(),
    updatedAt: now()
  };
  assertNoForbiddenPersistence(record as Record<string, unknown>, "metric");
  await db.metrics.put(record);
  return record;
}

export async function exportSession(sessionId: string) {
  const session = await db.sessions.get(sessionId);
  if (!session) return null;
  const events = await getEventsForSession(sessionId);
  const signals = await getSignalsForSession(sessionId);
  const metrics = await db.metrics.where("sessionId").equals(sessionId).toArray();
  return { session, events, signals, metrics };
}

export async function deleteSession(sessionId: string) {
  await db.transaction("rw", db.sessions, db.events, db.signals, db.metrics, async () => {
    await db.events.where("sessionId").equals(sessionId).delete();
    await db.signals.where("sessionId").equals(sessionId).delete();
    await db.metrics.where("sessionId").equals(sessionId).delete();
    await db.sessions.delete(sessionId);
  });
}
