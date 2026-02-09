export type Session = Readonly<{
  id: string;
  createdAt: number;
  endedAt?: number;
  engineVersion: string;
  settingsSnapshot?: Record<string, unknown>;
}>;
