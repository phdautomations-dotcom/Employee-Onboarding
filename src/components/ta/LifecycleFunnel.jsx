/* Employee Lifecycle Funnel — post-recruitment phases, one row each.
   `count` = employees who have reached that phase (falls left to right);
   `note` = the short live detail; the phase needing HR attention is flagged.
   `stages` = [{ label, count, pct, note, attention, onClick }] in order. */
export default function LifecycleFunnel({ stages }) {
  return (
    <div className="ta-lc">
      {stages.map((s) => (
        <button
          key={s.label}
          type="button"
          className={`ta-lc__row${s.attention ? ' is-attn' : ''}`}
          onClick={s.onClick}
        >
          <span className="ta-lc__top">
            <span className="ta-lc__label">{s.label}</span>
            {s.note && <span className="ta-lc__note">{s.note}</span>}
            <span className="ta-lc__count">{s.count}</span>
          </span>
          <span className="ta-lc__bar"><span style={{ width: `${s.pct}%` }} /></span>
        </button>
      ))}
    </div>
  );
}
