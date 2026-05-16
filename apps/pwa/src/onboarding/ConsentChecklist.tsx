type ConsentState = {
  understood: boolean;
};

type ConsentChecklistProps = {
  value: ConsentState;
  onChange: (value: ConsentState) => void;
};

export default function ConsentChecklist({ value, onChange }: ConsentChecklistProps) {
  return (
    <div className="consent-checklist">
      <label className="consent-row">
        <input
          type="checkbox"
          checked={value.understood}
          onChange={() => onChange({ understood: !value.understood })}
        />
        <span>
          I understand this app processes audio locally in real time. No audio or
          transcripts are stored. I can delete all session data at any time.
        </span>
      </label>
    </div>
  );
}
