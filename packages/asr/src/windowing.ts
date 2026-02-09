export type WindowingConfig = {
  windowSeconds: number;
  stepSeconds: number;
};

export function shouldRunWindow(
  lastRunMs: number,
  nowMs: number,
  config: WindowingConfig
) {
  return nowMs - lastRunMs >= config.stepSeconds * 1000;
}
