import Icon from '../common/Icon.jsx';
import Sparkline from '../common/Sparkline.jsx';

/* One dashboard KPI: icon + label, big number, then EITHER
   - a `meter` { value, max, hint } — a proportion bar with a plain-language hint, or
   - a `trend` / `note` line plus an optional 8-week `spark` sparkline.
   `accent` picks the icon tint. `onClick` makes the whole card a link. */
export default function KpiCard({ icon, label, value, trend, note, spark, meter, accent = 'blue', onClick }) {
  const wash = `var(--tag-${accent}-bg)`;
  const fg = `var(--tag-${accent}-fg)`;

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
  const pct = meter ? Math.max(4, Math.min(100, Math.round((meter.value / (meter.max || 1)) * 100))) : 0;

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={`ta-kpi${onClick ? ' ta-kpi--link' : ''}`}
      style={{ '--k-wash': wash, '--k-fg': fg }}
      onClick={onClick}
    >
      <div className="ta-kpi__top">
        <span className="ta-kpi__icon"><Icon name={icon} size={19} /></span>
        <span className="ta-kpi__label">{label}</span>
      </div>
      <div className="ta-kpi__value">{value}</div>

      {meter ? (
        <div className="ta-kpi__meter">
          <div className="ta-kpi__meter-track"><span style={{ width: `${pct}%` }} /></div>
          <span className="ta-kpi__meter-hint">{meter.hint}</span>
        </div>
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
