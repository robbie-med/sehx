export const PHASES = ["foreplay", "intercourse", "cooldown"] as const;

export type Phase = (typeof PHASES)[number];
