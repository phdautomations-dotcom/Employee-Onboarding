import { useState } from 'react';

/* Employee Lifecycle Funnel — one continuous SVG funnel silhouette.
   Segments touch (no gaps) and share a single indigo gradient, so it reads as
   one shape. Values sit outside on the right with leader lines; retention sits
   between the bands. Hovering a phase lifts it and dims the rest.
   `stages` = [{ label, count, pct, note, attention, onClick }] in order. */

const VB_W = 340;
const BAND_H = 46;
const CX = 128;                 // funnel centre — left of middle, room for labels
const HALF = (pct) => 34 + (Math.max(pct, 0) / 100) * 92;   // half-width of a band

export default function LifecycleFunnel({ stages }) {
  const [hover, setHover] = useState(null);
  const H = stages.length * BAND_H;

  return (
    <div className="ta-lcf" onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${VB_W} ${H}`} role="img" aria-label="Employee lifecycle funnel">
        <defs>
          <linearGradient id="lcfGrad" x1="0" y1="0" x2="0" y2={H} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4457c9" />
            <stop offset="100%" stopColor="#8ea2f0" />
          </linearGradient>
          <filter id="lcfSh" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#1f2b52" floodOpacity="0.16" />
          </filter>
        </defs>

        <g filter="url(#lcfSh)">
          {stages.map((s, i) => {
            const y = i * BAND_H;
            const tw = HALF(s.pct);
            const bw = HALF(stages[i + 1] ? stages[i + 1].pct : s.pct);
            const d = `M ${CX - tw} ${y} L ${CX + tw} ${y} L ${CX + bw} ${y + BAND_H} L ${CX - bw} ${y + BAND_H} Z`;
            const active = hover === i;
            const dim = hover != null && !active;
            return (
              <g
                key={s.label}
                className="ta-lcf__band"
                style={{ opacity: dim ? 0.34 : 1, transform: active ? 'translateX(3px)' : 'none' }}
                onMouseEnter={() => setHover(i)}
                onClick={s.onClick}
                role="button"
                tabIndex={0}
              >
                <path d={d} fill="url(#lcfGrad)" />
                {s.attention && <path d={d} fill="none" stroke="#e8983c" strokeWidth="2.5" />}
                {/* value + label outside, on the right */}
                <line x1={CX + Math.max(tw, bw)} y1={y + BAND_H / 2} x2={244} y2={y + BAND_H / 2} className="ta-lcf__lead" />
                <text x={250} y={y + BAND_H / 2} className="ta-lcf__val" dominantBaseline="central">
                  <tspan className="ta-lcf__num">{s.count}</tspan>
                  <tspan dx="6" className="ta-lcf__name">{s.label}</tspan>
                </text>
              </g>
            );
          })}

          {/* retention between bands, on the left */}
          {stages.slice(1).map((s, i) => (
            <text
              key={`r-${s.label}`}
              x={CX - HALF(stages[i].pct) - 8}
              y={i * BAND_H + BAND_H}
              className="ta-lcf__drop"
              textAnchor="end"
              dominantBaseline="central"
            >
              {stages[i].count ? Math.round((s.count / stages[i].count) * 100) : 0}%
            </text>
          ))}
        </g>
      </svg>

      {hover != null && (
        <div className="ta-lcf__tip" style={{ top: `${((hover + 0.5) / stages.length) * 100}%` }}>
          <b>{stages[hover].label}</b>
          <span>{stages[hover].count} · {stages[hover].pct}% of intake{stages[hover].note ? ` · ${stages[hover].note}` : ''}</span>
        </div>
      )}
    </div>
  );
}
