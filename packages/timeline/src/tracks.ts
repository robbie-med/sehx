export type TrackId =
  | "session"
  | "phases"
  | "positions"
  | "speech"
  | "orgasm"
  | "intensity"
  | "rhythm"
  | "silence";

export type TrackDefinition = {
  id: TrackId;
  label: string;
  kind: "segment" | "marker" | "series";
};

export const TRACKS: TrackDefinition[] = [
  { id: "session", label: "Session", kind: "segment" },
  { id: "phases", label: "Phases", kind: "segment" },
  { id: "positions", label: "Positions", kind: "segment" },
  { id: "speech", label: "Speech", kind: "marker" },
  { id: "orgasm", label: "Orgasm", kind: "marker" },
  { id: "intensity", label: "Intensity", kind: "series" },
  { id: "rhythm", label: "Rhythm", kind: "series" },
  { id: "silence", label: "Silence", kind: "segment" }
];

export const TRACK_ORDER = TRACKS.map((track) => track.id);
