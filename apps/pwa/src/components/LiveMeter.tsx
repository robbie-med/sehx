type LiveMeterProps = {
  rms: number;
  active: boolean;
};

export default function LiveMeter({ rms, active }: LiveMeterProps) {
  const fill = Math.min(rms * 400, 100);
  return (
    <div className={`live-meter${active ? " live-meter--active" : ""}`}>
      <div className="live-meter-fill" style={{ width: `${fill}%` }} />
    </div>
  );
}
