import { useState } from 'react';
import Icon from '../common/Icon.jsx';

/* A stacked-bar breakdown of a set of stages: one segment per stage sized by
   its share, then a legend with count + %. Hovering a segment or row dims the
   rest; clicking either fires the stage's `onClick`.
   `stages` = [{ label, value, tone, onClick? }] in order. */
export default function StageBreakdown({ stages, total }) {
  const [hover, setHover] = useState(null);
  const sum = total ?? stages.reduce((s, x) => s + x.value, 0);
  const pct = (v) => (sum ? Math.round((v / sum) * 100) : 0);

  return (
    <div className="ta-sbd">
      <div className="ta-sbd__bar">
        {stages.filter((s) => s.value > 0).map((s) => (
          <button
            key={s.label}
            type="button"
            className="ta-sbd__seg"
            style={{
              flexGrow: s.value,
              background: `var(--tag-${s.tone || 'blue'}-fg)`,
              opacity: hover && hover !== s.label ? 0.35 : 1,
            }}
            onMouseEnter={() => setHover(s.label)}
            onMouseLeave={() => setHover(null)}
            onClick={s.onClick}
            aria-label={`${s.label}: ${s.value} (${pct(s.value)}%)`}
          />
        ))}
      </div>

      <div className="ta-sbd__legend">
        {stages.map((s) => (
          <button
            key={s.label}
            type="button"
            className={`ta-sbd__row${hover === s.label ? ' is-hover' : ''}`}
            onMouseEnter={() => setHover(s.label)}
            onMouseLeave={() => setHover(null)}
            onClick={s.onClick}
          >
            <span className="ta-sbd__dot" style={{ background: `var(--tag-${s.tone || 'blue'}-fg)` }} />
            <span className="ta-sbd__label">{s.label}</span>
            <span className="ta-sbd__val">{s.value}</span>
            <span className="ta-sbd__pct">{pct(s.value)}%</span>
            {s.onClick && <Icon name="ChevronRight" size={14} className="ta-sbd__go" />}
          </button>
        ))}
      </div>
    </div>
  );
}
