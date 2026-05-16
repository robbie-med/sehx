import { useState } from "react";
import type { TimelineBuildResult } from "@sexmetrics/timeline";
import TimelineView from "../timeline/TimelineView";
import { formatDuration } from "../utils/time";
import { labelForMetric } from "../utils/eventLabels";

type Event = { id: string; type: string; t: number; confidence?: number };

type ScoreResult = {
  total: number;
  components: Array<{ key: string; score: number }>;
} | null;

type SessionSummaryProps = {
  durationSeconds: number;
  score: ScoreResult;
  events: Event[];
  timeline: TimelineBuildResult;
  sessionLabel?: string;
  sessionRating?: number;
  onSessionLabelChange: (v: string) => void;
  onSessionRatingChange: (v?: number) => void;
  onDelete: () => void;
  onExport: () => void;
};

type Phase = { name: string; start: number; end: number };

function computePhases(events: Event[], totalDuration: number): Phase[] {
  const phases: Phase[] = [];
  const phaseStarts = ["PHASE_START_FOREPLAY", "PHASE_START_INTERCOURSE", "PHASE_START_COOLDOWN"];
  const phaseNames: Record<string, string> = {
    PHASE_START_FOREPLAY:    "Foreplay",
    PHASE_START_INTERCOURSE: "Intercourse",
    PHASE_START_COOLDOWN:    "Cooldown",
  };

  const markers = events
    .filter((e) => phaseStarts.includes(e.type))
    .sort((a, b) => a.t - b.t);

  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].t;
    const end = markers[i + 1]?.t ?? totalDuration;
    if (end - start > 0) {
      phases.push({ name: phaseNames[markers[i].type] ?? markers[i].type, start, end });
    }
  }
  return phases;
}

export default function SessionSummary({
  durationSeconds,
  score,
  events,
  timeline,
  sessionLabel,
  sessionRating,
  onSessionLabelChange,
  onSessionRatingChange,
  onDelete,
  onExport,
}: SessionSummaryProps) {
  const [zoom, setZoom] = useState<"1m" | "5m" | "full">("full");

  const phases = computePhases(events, durationSeconds);

  const orgasms   = events.filter((e) => e.type === "ORGASM_EVENT").length;
  const stops     = events.filter((e) => e.type === "STOP").length;
  const positions = events.filter((e) => e.type === "POSITION_CHANGE").length;
  const feedback  = events.filter(
    (e) => e.type === "POSITIVE_FEEDBACK" || e.type === "NEGATIVE_FEEDBACK"
  ).length;

  const chips = [
    { count: orgasms,   label: "orgasm detected" },
    { count: stops,     label: "stop signal" },
    { count: positions, label: "position change" },
    { count: feedback,  label: "feedback moment" },
  ].filter((c) => c.count > 0);

  return (
    <div className="summary-view">
      {score !== null && (
        <div className="summary-score-block">
          <div className="summary-score-big">{score.total.toFixed(0)}</div>
          <div className="summary-score-label">Score</div>
        </div>
      )}

      <div className="summary-duration-row">
        <div className="summary-duration">{formatDuration(durationSeconds)}</div>
        <div className="summary-score-label">Total time</div>
      </div>

      {phases.length > 0 && (
        <>
          <div className="summary-section-title">Phases</div>
          <div className="summary-phase-list">
            {phases.map((phase) => (
              <div key={phase.name} className="summary-phase-item">
                <span className="summary-phase-name">{phase.name}</span>
                <span className="summary-phase-dur">
                  {formatDuration(phase.end - phase.start)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {chips.length > 0 && (
        <>
          <div className="summary-section-title">Highlights</div>
          <div className="summary-chips">
            {chips.map((chip) => (
              <span key={chip.label} className="summary-chip">
                <span className="summary-chip-count">{chip.count}</span>
                {chip.count === 1 ? chip.label : `${chip.label}s`}
              </span>
            ))}
          </div>
        </>
      )}

      {score !== null && score.components.length > 0 && (
        <>
          <div className="summary-section-title">Score breakdown</div>
          <div className="summary-score-components">
            {score.components.map((c) => (
              <div key={c.key} className="summary-component-row">
                <span className="summary-component-label">{labelForMetric(c.key)}</span>
                <span className="summary-component-value">
                  {(c.score * 100).toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {timeline.duration > 0 && (
        <div className="summary-timeline-section">
          <div className="summary-timeline-toolbar">
            <span className="summary-timeline-label">Timeline</span>
            {(["1m", "5m", "full"] as const).map((level) => (
              <button
                key={level}
                className={`ghost${zoom === level ? " active" : ""}`}
                onClick={() => setZoom(level)}
              >
                {level}
              </button>
            ))}
          </div>
          <TimelineView data={timeline} />
        </div>
      )}

      <div className="summary-review-section">
        <div className="summary-section-title">Reflection</div>
        <label className="review-row">
          Label
          <input
            type="text"
            value={sessionLabel ?? ""}
            placeholder="Optional label"
            onChange={(e) => onSessionLabelChange(e.target.value)}
          />
        </label>
        <div>
          <div className="summary-section-title" style={{ marginBottom: 6 }}>Rating</div>
          <div className="summary-stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className={`summary-star${(sessionRating ?? 0) >= star ? " filled" : ""}`}
                onClick={() =>
                  onSessionRatingChange(sessionRating === star ? undefined : star)
                }
              >
                ★
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="summary-actions">
        <button className="ghost" onClick={onExport}>Export</button>
        <button className="danger" onClick={onDelete}>Delete session</button>
      </div>
    </div>
  );
}
