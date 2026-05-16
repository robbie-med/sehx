import { useState } from "react";
import { exportSession, type listSessions } from "@sexmetrics/storage";
import { computeScore } from "@sexmetrics/analytics";
import { formatDuration } from "../utils/time";

type SessionRow = Awaited<ReturnType<typeof listSessions>>[number];
type ExportedSession = Awaited<ReturnType<typeof exportSession>>;

type HistoryViewProps = {
  sessions: SessionRow[];
};

export default function HistoryView({ sessions }: HistoryViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ExportedSession | null>(null);

  const toggle = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(id);
    const data = await exportSession(id);
    setDetail(data);
  };

  return (
    <div className="history-view">
      <h2>History</h2>
      {sessions.length === 0 ? (
        <div className="session-empty">No sessions stored yet.</div>
      ) : (
        <div className="history-list">
          {sessions.map((session) => {
            const expanded = expandedId === session.id;
            const durationSec =
              session.endedAt
                ? Math.max(
                    0,
                    (session.endedAt - session.createdAt - session.totalPausedMs) / 1000
                  )
                : null;

            const score =
              expanded && detail?.events.length
                ? computeScore(detail.events)
                : null;

            return (
              <button
                key={session.id}
                className={`history-item${expanded ? " expanded" : ""}`}
                onClick={() => toggle(session.id)}
              >
                <div className="history-item-header">
                  <div className="history-item-date">
                    {new Date(session.createdAt).toLocaleString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="history-item-dur">
                    {durationSec !== null ? formatDuration(durationSec) : "in progress"}
                  </div>
                </div>

                {expanded && detail && (
                  <div className="history-item-detail">
                    {score !== null && (
                      <div className="history-detail-row">
                        <span>Score</span>
                        <span className="history-detail-val">
                          {score.total.toFixed(0)}
                        </span>
                      </div>
                    )}
                    <div className="history-detail-row">
                      <span>Events</span>
                      <span className="history-detail-val">{detail.events.length}</span>
                    </div>
                    {session.label && (
                      <div className="history-detail-row">
                        <span>Label</span>
                        <span className="history-detail-val">{session.label}</span>
                      </div>
                    )}
                    {session.rating && (
                      <div className="history-detail-row">
                        <span>Rating</span>
                        <span className="history-detail-val">
                          {"★".repeat(session.rating)}{"☆".repeat(5 - session.rating)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
