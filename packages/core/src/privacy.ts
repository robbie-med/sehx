// Guardrail: persistent storage must never include audio or transcripts.
const FORBIDDEN_PERSISTENCE_KEYS = [
  "audio",
  "transcript",
  "pcm",
  "wave",
  "wav",
  "mp3",
  "ogg",
  "flac",
  "text"
] as const;

export type ForbiddenPersistenceKey = (typeof FORBIDDEN_PERSISTENCE_KEYS)[number];

export function assertNoForbiddenPersistence(
  record: Record<string, unknown>,
  context: string
): void {
  for (const key of Object.keys(record)) {
    if (FORBIDDEN_PERSISTENCE_KEYS.includes(key as ForbiddenPersistenceKey)) {
      throw new Error(
        `Forbidden persistence key "${key}" detected in ${context}.`
      );
    }
  }
}

export function getForbiddenPersistenceKeys(): ReadonlyArray<ForbiddenPersistenceKey> {
  return FORBIDDEN_PERSISTENCE_KEYS;
}
