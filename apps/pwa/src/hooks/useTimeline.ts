import { useMemo, useState } from "react";
import type { Event, SignalPoint } from "@sexmetrics/core";
import { buildTimeline, type ZoomLevel } from "@sexmetrics/timeline";

export function useTimeline(events: Event[], signals: SignalPoint[]) {
  const [zoom, setZoom] = useState<ZoomLevel>("full");

  const timeline = useMemo(
    () => buildTimeline(events, signals, zoom),
    [events, signals, zoom]
  );

  return { zoom, setZoom, timeline };
}
