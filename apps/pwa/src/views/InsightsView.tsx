import { useState } from "react";
import type { computeWeeklyTrends, computeMonthlyTrends } from "@sexmetrics/analytics";
import { labelForMetric } from "../utils/eventLabels";

type TrendSeries = ReturnType<typeof computeWeeklyTrends>[number];

type InsightsViewProps = {
  weeklyTrends: TrendSeries[];
  monthlyTrends: TrendSeries[];
};

export default function InsightsView({ weeklyTrends, monthlyTrends }: InsightsViewProps) {
  const [mode, setMode] = useState<"weekly" | "monthly">("weekly");

  const series = mode === "weekly" ? weeklyTrends : monthlyTrends;
  const empty = weeklyTrends.length === 0 && monthlyTrends.length === 0;

  const latestValues = series
    .map((s) => {
      const last = s.points[s.points.length - 1];
      return last ? { key: s.key, value: last.value, period: last.period } : null;
    })
    .filter((v): v is NonNullable<typeof v> => v !== null && v.value > 0);

  const maxValue = Math.max(...latestValues.map((v) => v.value), 1);

  return (
    <div className="insights-view">
      <h2>Insights</h2>

      {empty ? (
        <div className="insights-empty">Complete a session to see trends.</div>
      ) : (
        <>
          <div className="insights-mode-tabs">
            <button
              className={`insights-mode-btn${mode === "weekly" ? " active" : ""}`}
              onClick={() => setMode("weekly")}
            >
              Weekly
            </button>
            <button
              className={`insights-mode-btn${mode === "monthly" ? " active" : ""}`}
              onClick={() => setMode("monthly")}
            >
              Monthly
            </button>
          </div>

          {latestValues.length === 0 ? (
            <div className="insights-empty">No data for this period yet.</div>
          ) : (
            latestValues.map(({ key, value }) => (
              <div key={key} className="trend-bar-row">
                <div className="trend-bar-label">{labelForMetric(key)}</div>
                <div className="trend-bar-track">
                  <div
                    className="trend-bar-fill"
                    style={{ width: `${Math.min((value / maxValue) * 100, 100)}%` }}
                  />
                </div>
                <div className="trend-bar-value">{value.toFixed(1)}</div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
