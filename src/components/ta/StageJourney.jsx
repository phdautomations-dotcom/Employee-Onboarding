import Icon from '../common/Icon.jsx';

/* Horizontal onboarding journey — one node per stage, joined by arrows that
   carry the drop-off between stages. The count is the headline; the bar and %
   show the share of the accepted cohort still at that stage or beyond.
   `stages` = [{ label, count, pct, drop, tone, icon, onClick }] in order. */
export default function StageJourney({ stages }) {
  return (
    <div className="ta-journey">
      {stages.map((s, i) => (
        <div className="ta-journey__step" key={s.label}>
          {i > 0 && (
            <span className="ta-journey__arrow" aria-hidden="true">
              <Icon name="ChevronRight" size={15} />
              {s.drop > 0 && <span className="ta-journey__drop">−{s.drop}</span>}
            </span>
          )}
          <button
            type="button"
            className="ta-journey__node"
            onClick={s.onClick}
            title={`View ${s.count} candidate${s.count === 1 ? '' : 's'}`}
            style={{ '--n-fg': `var(--tag-${s.tone}-fg)`, '--n-bg': `var(--tag-${s.tone}-bg)` }}
          >
            <span className="ta-journey__head">
              <span className="ta-journey__icon"><Icon name={s.icon} size={14} /></span>
              <span className="ta-journey__name">{s.label}</span>
            </span>
            <span className="ta-journey__figs">
              <span className="ta-journey__count">{s.count}</span>
              <span className="ta-journey__pct">{s.pct}%</span>
            </span>
            <span className="ta-journey__meter">
              <span className="ta-journey__fill" style={{ width: `${s.pct}%` }} />
            </span>
          </button>
        </div>
      ))}
    </div>
  );
}
