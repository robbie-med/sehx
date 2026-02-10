import type { Event } from "@sexmetrics/core";

type Listener = (type: Event["type"]) => void;

class SessionBus {
  private listeners = new Set<Listener>();

  emit(type: Event["type"]) {
    for (const listener of this.listeners) {
      listener(type);
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
