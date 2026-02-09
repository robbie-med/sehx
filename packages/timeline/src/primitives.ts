import type { TrackId } from "./tracks";

export type TimelinePrimitive = {
  id: string;
  track: TrackId;
  kind: "segment" | "marker" | "series";
  tStart: number;
  tEnd?: number;
  label?: string;
  payload?: Record<string, unknown>;
};

export type TimelineBuildResult = {
  duration: number;
  primitives: TimelinePrimitive[];
};
