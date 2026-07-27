interface MeterProps {
  label: string;
  value: number;
  max?: number;
  color: string;
  /** Right-hand readout. Defaults to a percentage. */
  readout?: string;
}

/** The thin labelled bar used throughout the HUD. */
export function Meter({ label, value, max = 100, color, readout }: MeterProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;

  return (
    <div className="space-y-[6px]">
      <div className="flex items-baseline justify-between gap-2">
        <span className="micro-strong">{label}</span>
        <span
          className="text-[10px] tabular-nums"
          style={{ color: 'var(--text-muted)' }}
        >
          {readout ?? `${Math.round(pct)}%`}
        </span>
      </div>
      <div className="meter" style={{ ['--meter-color' as string]: color }}>
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
