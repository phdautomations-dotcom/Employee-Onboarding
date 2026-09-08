import { useState } from 'react';

/* Onboarding funnel: centred bands that narrow with the count. Each band shows
   its count and its share of the total; the gap between bands names the
   drop-off. `stages` = [{ label, value, tone, onClick? }] cumulative, in order. */
export default function Funnel({ stages, total }) {
  const [hover, setHover] = useState(null);
  const first = stages[0]?.value || 1;
  const base = total ?? first;

  return (
    <div className="ta-funnel2">
      {stages.map((s, i) => {
        const w = 34 + (s.value / first) * 66; // 34%..100% so labels always fit
        const drop = i > 0 ? stages[i - 1].value - s.value : 0;
        const pct = base ? Math.round((s.value / base) * 100) : 0;
        const Tag = s.onClick ? 'button' : 'div';
        return (
          <div className="ta-funnel2__step" key={s.label}>
            {i > 0 && (
              <span className="ta-funnel2__drop">{drop > 0 ? `− ${drop} not through yet` : 'no drop-off'}</span>
            )}
            <Tag
              type={s.onClick ? 'button' : undefined}
              className="ta-funnel2__band"
              style={{
                width: `${w}%`,
                background: `var(--tag-${s.tone || 'blue'}-fg)`,
                opacity: hover && hover !== s.label ? 0.4 : 1,
              }}
              onMouseEnter={() => setHover(s.label)}
              onMouseLeave={() => setHover(null)}
              onClick={s.onClick}
            >
              <span className="ta-funnel2__name">{s.label}</span>
              <span className="ta-funnel2__nums">
                <b>{s.value}</b>
                <span className="ta-funnel2__pct">{pct}%</span>
              </span>
            </Tag>
          </div>
        );
      })}
    </div>
  );
}
