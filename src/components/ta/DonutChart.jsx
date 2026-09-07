import { useState } from 'react';

/* Donut chart for a small set of categories (<= 5).
   Hover a slice (or its legend row): the slice pops out, the rest dim, and
   the centre shows that slice's numbers. `slices` = [{ label, value, color }]. */
export default function DonutChart({ slices, caption = 'Total' }) {
  const [hover, setHover] = useState(null); // hovered slice label
  const total = slices.reduce((sum, s) => sum + s.value, 0) || 1;
  const size = 170;
  const stroke = 24;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const gap = 3;

  let offset = 0;
  const arcs = slices
    .filter((s) => s.value > 0)
    .map((s) => {
      const len = (s.value / total) * circumference;
      const midDeg = (offset / circumference) * 360 - 90 + (len / 2 / circumference) * 360;
      const rad = (midDeg * Math.PI) / 180;
      const arc = {
        ...s,
        dash: `${Math.max(0, len - gap)} ${circumference}`,
        rot: (offset / circumference) * 360 - 90,
        dx: Math.cos(rad) * 7,
        dy: Math.sin(rad) * 7,
      };
      offset += len;
      return arc;
    });

  const shown = hover ? slices.find((s) => s.label === hover) : null;

  return (
    <div className="ta-donut-wrap" onMouseLeave={() => setHover(null)}>
      <div className="ta-donut">
        <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ta-line)" strokeWidth={stroke} />
          {arcs.map((a) => {
            const active = hover === a.label;
            const dim = hover && !active;
            return (
              <circle
                key={a.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={a.color}
                strokeWidth={active ? stroke + 3 : stroke}
                strokeDasharray={a.dash}
                transform={`translate(${active ? a.dx : 0} ${active ? a.dy : 0}) rotate(${a.rot} ${size / 2} ${size / 2})`}
                style={{ opacity: dim ? 0.35 : 1 }}
                onMouseEnter={() => setHover(a.label)}
              />
            );
          })}
        </svg>
        <div className="ta-donut__center">
          <span className="ta-donut__total">{shown ? shown.value : total}</span>
          <span className="ta-donut__caption">{shown ? shown.label : caption}</span>
        </div>
      </div>

      <div className="ta-legend">
        {slices.map((s) => (
          <div
            className={`ta-legend__row${hover === s.label ? ' is-hover' : ''}${hover && hover !== s.label ? ' is-dim' : ''}`}
            key={s.label}
            onMouseEnter={() => setHover(s.label)}
          >
            <span className="ta-legend__dot" style={{ background: s.color }} />
            <span className="ta-legend__name">{s.label}</span>
            <span className="ta-legend__val">{s.value}</span>
            <span className="ta-legend__pct">{Math.round((s.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
