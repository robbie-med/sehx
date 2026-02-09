type ConsentState = {
  privacy: boolean;
  foreground: boolean;
  permissions: boolean;
  speechOptIn: boolean;
};

type ConsentChecklistProps = {
  value: ConsentState;
  onChange: (value: ConsentState) => void;
};

export default function ConsentChecklist({
  value,
  onChange
}: ConsentChecklistProps) {
  const update = (key: keyof ConsentState) => {
    onChange({ ...value, [key]: !value[key] });
  };

  return (
    <div className="consent-checklist">
      <label className="consent-row">
        <input
          type="checkbox"
          checked={value.privacy}
          onChange={() => update("privacy")}
        />
        <span>
          I understand no audio or transcripts are stored. Data stays on-device.
        </span>
      </label>
      <label className="consent-row">
        <input
          type="checkbox"
          checked={value.foreground}
          onChange={() => update("foreground")}
        />
        <span>Sessions require the screen on with the app open.</span>
      </label>
      <label className="consent-row">
        <input
          type="checkbox"
          checked={value.permissions}
          onChange={() => update("permissions")}
        />
        <span>Microphone permission is requested only at session start.</span>
      </label>
      <label className="consent-row">
        <input
          type="checkbox"
          checked={value.speechOptIn}
          onChange={() => update("speechOptIn")}
        />
        <span>Speech processing is off by default and can be enabled later.</span>
      </label>
    </div>
  );
}
