export type RhythmResult = {
  strength: number;
  bpm?: number;
};

export function computeRhythmStrength(
  values: number[],
  sampleRateHz: number,
  minBpm = 30,
  maxBpm = 180
): RhythmResult {
  if (values.length < 6 || sampleRateHz <= 0) {
    return { strength: 0 };
  }

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const centered = values.map((v) => v - mean);
  const energy = centered.reduce((sum, v) => sum + v * v, 0);
  if (energy === 0) return { strength: 0 };

  const minLag = Math.max(1, Math.floor((60 * sampleRateHz) / maxBpm));
  const maxLag = Math.min(
    values.length - 2,
    Math.ceil((60 * sampleRateHz) / minBpm)
  );
  if (maxLag <= minLag) return { strength: 0 };

  let bestLag = minLag;
  let bestCorr = 0;
  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let corr = 0;
    for (let i = lag; i < centered.length; i += 1) {
      corr += centered[i] * centered[i - lag];
    }
    corr /= energy;
    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }

  const bpm = (60 * sampleRateHz) / bestLag;
  return {
    strength: Math.max(0, Math.min(1, bestCorr)),
    bpm: Number.isFinite(bpm) ? bpm : undefined
  };
}
