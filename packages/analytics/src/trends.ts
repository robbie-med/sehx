import type { StoredMetric } from "@sexmetrics/storage";

export type TrendPoint = {
  period: string;
  value: number;
};

export type TrendSeries = {
  key: string;
  points: TrendPoint[];
};

export function computeWeeklyTrends(metrics: StoredMetric[]): TrendSeries[] {
  return computeTrends(metrics, "week");
}

export function computeMonthlyTrends(metrics: StoredMetric[]): TrendSeries[] {
  return computeTrends(metrics, "month");
}

function computeTrends(metrics: StoredMetric[], mode: "week" | "month") {
  const byKey = new Map<string, Map<string, number[]>>();
  for (const metric of metrics) {
    const period = periodKey(metric.createdAt, mode);
    if (!byKey.has(metric.key)) byKey.set(metric.key, new Map());
    const bucket = byKey.get(metric.key)!;
    if (!bucket.has(period)) bucket.set(period, []);
    bucket.get(period)!.push(metric.value);
  }

  const series: TrendSeries[] = [];
  for (const [key, bucket] of byKey.entries()) {
    const points: TrendPoint[] = [];
    for (const [period, values] of bucket.entries()) {
      points.push({
        period,
        value: average(values)
      });
    }
    points.sort((a, b) => a.period.localeCompare(b.period));
    series.push({ key, points });
  }
  return series;
}

function periodKey(timestamp: number, mode: "week" | "month") {
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  if (mode === "month") {
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }
  const week = getWeekNumber(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function getWeekNumber(date: Date) {
  const target = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return weekNo;
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
