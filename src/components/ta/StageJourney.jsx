import Icon from '../common/Icon.jsx';

/* Onboarding stage tracker — seven milestones left to right, joined by arrows.
   The count is the headline; the bar and % show the share of the accepted
   cohort still at that stage or beyond. Nodes are clickable.
   `stages` = [{ label, count, pct, tone, icon, onClick }] in order. */
export default function StageJourney({ stages }) {
  return (
    <div className="ta-track">
      {stages.map((s, i) => (
        <div className="ta-track__step" key={s.label}>
          {i > 0 && (
            <span className="ta-track__arrow" aria-hidden="true">
              <Icon name="ChevronRight" size={16} />
            </span>
          )}
          <button
            type="button"
            className="ta-track__node"
            onClick={s.onClick}
            title={`View ${s.count} candidate${s.count === 1 ? '' : 's'}`}
            style={{ '--n-fg': `var(--tag-${s.tone}-fg)`, '--n-bg': `var(--tag-${s.tone}-bg)` }}
          >
            <span className="ta-track__icon"><Icon name={s.icon} size={16} /></span>
            <span className="ta-track__name">{s.label}</span>
            <span className="ta-track__count">{s.count}</span>
            <span className="ta-track__pct">{s.pct}%</span>
            <span className="ta-track__meter">
              <span className="ta-track__fill" style={{ width: `${s.pct}%` }} />
            </span>
          </button>
        </div>
      ))}
    </div>
  );
}
