import Icon from '../common/Icon.jsx';
import Sparkline from '../common/Sparkline.jsx';

/* One dashboard KPI. Two footer styles:
   - `meter` { value, max, hint } → a thick proportion bar with a % badge and a
     short noun hint naming the whole ("candidates in onboarding").
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
  const pct = meter ? Math.max(2, Math.min(100, Math.round((meter.value / (meter.max || 1)) * 100))) : 0;

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

      <div className="ta-kpi__value">{value}</div>

      {meter ? (
        <>
          <div className="ta-kpi__bar">
            <span className="ta-kpi__bar-track"><span className="ta-kpi__bar-fill" style={{ width: `${pct}%` }} /></span>
            <span className="ta-kpi__bar-pct">{pct}%</span>
          </div>
          <div className="ta-kpi__hint">{meter.hint}</div>
        </>
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
