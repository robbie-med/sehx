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
  const visited = new Set<unknown>();
  const walk = (value: unknown, path: string) => {
    if (!value || typeof value !== "object") return;
    if (visited.has(value)) return;
    visited.add(value);

    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i += 1) {
        walk(value[i], `${path}[${i}]`);
      }
      return;
    }

    for (const [key, next] of Object.entries(value)) {
      if (FORBIDDEN_PERSISTENCE_KEYS.includes(key as ForbiddenPersistenceKey)) {
        const location = path ? `${path}.${key}` : key;
        throw new Error(
          `Forbidden persistence key "${key}" detected in ${context} at ${location}.`
        );
      }
      walk(next, path ? `${path}.${key}` : key);
    }
  };

  walk(record, "");
}

export function getForbiddenPersistenceKeys(): ReadonlyArray<ForbiddenPersistenceKey> {
  return FORBIDDEN_PERSISTENCE_KEYS;
}
