import type { Event } from "@sexmetrics/core";

export type BusEvent = {
  type: Event["type"];
  confidence?: number;
  payload?: Record<string, unknown>;
};

type Listener = (event: BusEvent) => void;

class SessionBus {
  private listeners = new Set<Listener>();

  emit(event: Event["type"] | BusEvent) {
    const payload = typeof event === "string" ? { type: event } : event;
    for (const listener of this.listeners) {
      listener(payload);
    }
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const sessionBus = new SessionBus();
