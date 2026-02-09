const modelCache = new Map<string, ArrayBuffer>();

export async function loadLocalModel(modelRef: string) {
  if (modelCache.has(modelRef)) return modelCache.get(modelRef);
  const response = await fetch(modelRef);
  if (!response.ok) {
    throw new Error(`Failed to load model at ${modelRef}`);
  }
  const buffer = await response.arrayBuffer();
  modelCache.set(modelRef, buffer);
  return buffer;
}
