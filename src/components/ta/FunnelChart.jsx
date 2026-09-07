import { useState } from 'react';

/* Stage funnel — coloured trapezoid bands that narrow down the pipeline.
   Hover a band: it lifts, the rest dim, and a tooltip shows the numbers.
   `stages` = [{ label, value }] in pipeline order. */
const RAMP = ['#4b7bf7', '#8b7ff0', '#f6a04a', '#46c98a', '#a5ddc2', '#c7e8d6'];

export default function FunnelChart({ stages }) {
  const [hover, setHover] = useState(null);
  const first = stages[0]?.value || 1;
  const max = Math.max(1, ...stages.map((s) => s.value));
  const bandH = 42;
  const gap = 4;
  const vbW = 240;
  const vbH = stages.length * bandH;
  const cx = 92;
  const widthFor = (v) => Math.max(16, (v / max) * 150);

  return (
    <div className="ta-chartbox" onMouseLeave={() => setHover(null)}>
      <svg className="ta-funnel" viewBox={`0 0 ${vbW} ${vbH}`} role="img" aria-label="Pipeline funnel">
        {stages.map((s, i) => {
          const y = i * bandH;
          const wTop = widthFor(s.value);
          const wBot = widthFor(stages[i + 1]?.value ?? s.value);
          const points = [
            `${cx - wTop / 2},${y + gap / 2}`,
            `${cx + wTop / 2},${y + gap / 2}`,
            `${cx + wBot / 2},${y + bandH - gap / 2}`,
            `${cx - wBot / 2},${y + bandH - gap / 2}`,
          ].join(' ');
          const active = hover === i;
          const dim = hover != null && !active;
          return (
            <g
              key={s.label}
              className="ta-funnel__band"
              style={{ transform: active ? 'translateY(-3px)' : 'none', opacity: dim ? 0.4 : 1 }}
              onMouseEnter={() => setHover(i)}
            >
              <polygon points={points} fill={RAMP[i] || RAMP[RAMP.length - 1]} />
              <line x1={cx + wTop / 2} y1={y + bandH / 2} x2={206} y2={y + bandH / 2} stroke="var(--ta-line)" strokeWidth="1" />
              <text className="ta-funnel__pct" x={210} y={y + bandH / 2} dominantBaseline="central">
                {Math.round((s.value / first) * 100)}%
              </text>
            </g>
          );
        })}
      </svg>

      {hover != null && (
        <div className="ta-charttip" style={{ top: `${((hover + 0.5) / stages.length) * 100}%` }}>
          <b>{stages[hover].label}</b> · {stages[hover].value} ({Math.round((stages[hover].value / first) * 100)}%)
        </div>
      )}
    </div>
  );
}
