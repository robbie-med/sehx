import Dexie, { type Table } from "dexie";
import type {
  StoredEvent,
  StoredMetric,
  StoredSession,
  StoredSignal
} from "./schema";

export class SexMetricsDB extends Dexie {
  sessions!: Table<StoredSession, string>;
  events!: Table<StoredEvent, string>;
  signals!: Table<StoredSignal, string>;
  metrics!: Table<StoredMetric, string>;

  constructor() {
    super("sexmetrics");
    this.version(1).stores({
      sessions: "id, createdAt, status",
      events: "id, sessionId, t, type",
      signals: "id, sessionId, t, type",
      metrics: "id, sessionId, key"
    });
  }
}

export const db = new SexMetricsDB();
