export type MetricKey = string;

export type Metric = Readonly<{
  sessionId: string;
  key: MetricKey;
  value: number;
  engineVersion: string;
}>;
