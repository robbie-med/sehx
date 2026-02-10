export const SIGNAL_TYPES = [
  "intensity",
  "rhythm",
  "silence",
  "pitch_proxy",
  "motion"
] as const;

export type SignalType = (typeof SIGNAL_TYPES)[number];

export type SignalPoint = Readonly<{
  sessionId: string;
  t: number;
  type: SignalType;
  value: number;
}>;
