import Icon from '../common/Icon.jsx';
import Sparkline from '../common/Sparkline.jsx';

/* One dashboard KPI. Two footer styles:
   - `meter` { value, max, hint } → a compact progress ring beside the number
     plus a plain-language hint line.
   - `trend` / `note` (+ optional 8-week `spark`) → a delta line and sparkline.
   `accent` is a tag tone (blue | amber | violet | green | teal | red). */
export default function KpiCard({ icon, label, value, trend, note, spark, meter, accent = 'blue', onClick }) {
  const fg = `var(--tag-${accent}-fg)`;
  const wash = `var(--tag-${accent}-bg)`;

  let footer = <span className="ta-trend ta-trend--flat">{note}</span>;
  if (trend) {
    const cls = trend > 0 ? 'ta-trend--up' : 'ta-trend--down';
    const arrow = trend > 0 ? 'ArrowUp' : 'ArrowDown';
    footer = (
      <span className={`ta-trend ${cls}`}>
        <Icon name={arrow} size={12} /> {Math.abs(trend)}% <span className="ta-trend__mute">vs last month</span>
      </span>
    );
  }

  const Tag = onClick ? 'button' : 'div';
  const pct = meter ? Math.max(3, Math.min(100, Math.round((meter.value / (meter.max || 1)) * 100))) : 0;

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={`ta-kpi${onClick ? ' ta-kpi--link' : ''}`}
      style={{ '--k-fg': fg, '--k-wash': wash }}
      onClick={onClick}
    >
      <div className="ta-kpi__head">
        <span className="ta-kpi__label">{label}</span>
        <span className="ta-kpi__icon"><Icon name={icon} size={16} /></span>
      </div>

      <div className="ta-kpi__body">
        <span className="ta-kpi__value">{value}</span>
        {meter && (
          <span className="ta-kpi__ring">
            <svg viewBox="0 0 40 40" aria-hidden="true">
              <circle className="ta-kpi__ring-bg" cx="20" cy="20" r="16" pathLength="100" />
              <circle className="ta-kpi__ring-fg" cx="20" cy="20" r="16" pathLength="100" strokeDasharray={`${pct} 100`} />
            </svg>
            <span className="ta-kpi__ring-num">{pct}%</span>
          </span>
        )}
      </div>

      {meter ? (
        <div className="ta-kpi__hint">{meter.hint}</div>
      ) : (
        <div className="ta-kpi__foot">
          {footer}
          {spark && spark.length > 1 && (
            <span className="ta-kpi__spark"><Sparkline data={spark} color={fg} height={26} /></span>
          )}
        </div>
      )}
    </Tag>
  );
}
