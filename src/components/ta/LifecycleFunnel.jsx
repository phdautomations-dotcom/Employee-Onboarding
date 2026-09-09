/* Employee Lifecycle Funnel — a real tapering funnel, top to bottom.
   Each segment is a centred trapezoid whose top edge matches the stage above
   and bottom edge the stage below, so the silhouette narrows as employees
   progress. `count` is the headline; the flagged phase turns amber.
   `stages` = [{ label, count, pct, note, attention, onClick }] in order. */
// Cool teal → indigo sequential ramp; dark enough throughout for white labels.
const TONE = ['#3f9d94', '#3f88ab', '#4470bd', '#4a57c0', '#4a3fae'];

export default function LifecycleFunnel({ stages }) {
  // Map the true % onto a readable width band — the funnel tapers but never
  // gets so thin the label won't fit.
  const w = (pct) => 44 + (pct / 100) * 56;

  return (
    <div className="ta-funnel">
      {stages.map((s, i) => {
        const top = w(s.pct);
        const bot = w(stages[i + 1] ? stages[i + 1].pct : s.pct * 0.8);
        const clip = `polygon(${(100 - top) / 2}% 0, ${(100 + top) / 2}% 0, ${(100 + bot) / 2}% 100%, ${(100 - bot) / 2}% 100%)`;
        return (
          <button
            key={s.label}
            type="button"
            className={`ta-funnel__seg${s.attention ? ' is-attn' : ''}`}
            onClick={s.onClick}
            title={`View ${s.label} — ${s.count}`}
          >
            <span
              className="ta-funnel__fill"
              style={{ clipPath: clip, background: s.attention ? undefined : TONE[i] || TONE[TONE.length - 1] }}
            />
            <span className="ta-funnel__text">
              <span className="ta-funnel__row">
                <span className="ta-funnel__label">{s.label}</span>
                <span className="ta-funnel__count">{s.count}</span>
              </span>
              {s.note && <span className="ta-funnel__note">{s.note}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
