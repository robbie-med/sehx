import type { TimelineBuildResult, TimelinePrimitive } from "@sexmetrics/timeline";
import { TRACKS } from "@sexmetrics/timeline";

type TimelineViewProps = {
  data: TimelineBuildResult;
  onSelect?: (primitive: TimelinePrimitive) => void;
};

export default function TimelineView({ data, onSelect }: TimelineViewProps) {
  const { duration, primitives } = data;
  if (!duration) {
    return (
      <section className="card timeline-card">
        <h1>Timeline</h1>
        <p>Start a session to see the timeline.</p>
      </section>
    );
  }

  return (
    <section className="card timeline-card">
      <h1>Timeline</h1>
      <div className="timeline-grid">
        {TRACKS.map((track) => {
          const items = primitives.filter((p) => p.track === track.id);
          return (
            <div key={track.id} className="timeline-row">
              <div className="timeline-label">{track.label}</div>
              <div className="timeline-lane">
                {items.map((item) => (
                  <TimelineItem
                    key={item.id}
                    item={item}
                    duration={duration}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TimelineItem({
  item,
  duration,
  onSelect
}: {
  item: TimelinePrimitive;
  duration: number;
  onSelect?: (primitive: TimelinePrimitive) => void;
}) {
  const left = (item.tStart / duration) * 100;
  const width = item.tEnd ? ((item.tEnd - item.tStart) / duration) * 100 : 0.6;
  const style = {
    left: `${left}%`,
    width: `${Math.max(width, 0.8)}%`
  };
  const className = `timeline-item ${item.kind}`;
  return (
    <button
      className={className}
      style={style}
      onClick={() => onSelect?.(item)}
      title={item.label ?? item.track}
    >
      {item.kind !== "series" ? item.label : ""}
    </button>
  );
}
