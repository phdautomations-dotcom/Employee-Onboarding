import Icon from '../common/Icon.jsx';
import Sparkline from '../common/Sparkline.jsx';

/* One dashboard KPI: icon + label, big number, a trend (or a short note when
   there is no prior period to compare), and an 8-week sparkline.
   `accent` picks the icon tint. `onClick` makes the whole card a link. */
export default function KpiCard({ icon, label, value, trend, note, spark, accent = 'blue', onClick }) {
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
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={`ta-kpi${onClick ? ' ta-kpi--link' : ''}`}
      style={{ '--k-wash': wash, '--k-fg': fg }}
      onClick={onClick}
    >
      <div className="ta-kpi__top">
        <span className="ta-kpi__icon"><Icon name={icon} size={18} /></span>
        <span className="ta-kpi__label">{label}</span>
      </div>
      <div className="ta-kpi__value">{value}</div>
      <div className="ta-kpi__foot">
        {footer}
        {spark && spark.length > 1 && (
          <span className="ta-kpi__spark"><Sparkline data={spark} color={fg} height={26} /></span>
        )}
      </div>
    </Tag>
  );
}
