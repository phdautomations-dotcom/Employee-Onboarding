import Icon from '../common/Icon.jsx';

/* Vertical onboarding funnel — one band per stage, stacked top to bottom.
   Each band is centred and its width is the share of the accepted cohort still
   at that stage or beyond, so the stack narrows as candidates progress. The
   count is the headline; bands are clickable.
   `stages` = [{ label, count, pct, tone, icon, onClick }] in order. */
export default function StageJourney({ stages }) {
  return (
    <div className="ta-funnel">
      {stages.map((s, i) => (
        <div className="ta-funnel__step" key={s.label}>
          {i > 0 && <span className="ta-funnel__link" aria-hidden="true" />}
          <span className="ta-funnel__label">
            <span className="ta-funnel__icon" style={{ '--n-fg': `var(--tag-${s.tone}-fg)`, '--n-bg': `var(--tag-${s.tone}-bg)` }}>
              <Icon name={s.icon} size={13} />
            </span>
            {s.label}
          </span>
          <button
            type="button"
            className="ta-funnel__band"
            onClick={s.onClick}
            title={`View ${s.count} candidate${s.count === 1 ? '' : 's'}`}
            style={{ width: `${Math.max(s.pct, 16)}%`, background: `var(--tag-${s.tone}-fg)` }}
          >
            <span className="ta-funnel__count">{s.count}</span>
            <span className="ta-funnel__pct">{s.pct}%</span>
          </button>
        </div>
      ))}
    </div>
  );
}
