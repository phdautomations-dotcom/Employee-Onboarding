import Icon from '../common/Icon.jsx';

/* A plain-language funnel: one band per stage, width tracks the count, the
   stage name and its single count sit on the band. Bands narrow top → bottom.
   Clicking a band opens the matching list (via each stage's `onClick`).
   `stages` = [{ label, value, tone, onClick? }] in workflow order. */
export default function StageFunnel({ stages }) {
  const max = Math.max(1, ...stages.map((s) => s.value));

  return (
    <div className="ta-sfunnel">
      {stages.map((s) => {
        const width = 44 + (s.value / max) * 56; // 44%..100%, so labels always fit
        const Tag = s.onClick ? 'button' : 'div';
        return (
          <Tag
            key={s.label}
            type={s.onClick ? 'button' : undefined}
            className="ta-sfunnel__band"
            style={{ width: `${width}%`, background: `var(--tag-${s.tone || 'blue'}-fg)` }}
            onClick={s.onClick}
          >
            <span className="ta-sfunnel__name">{s.label}</span>
            <span className="ta-sfunnel__end">
              <span className="ta-sfunnel__count">{s.value}</span>
              {s.onClick && <Icon name="ChevronRight" size={15} className="ta-sfunnel__go" />}
            </span>
          </Tag>
        );
      })}
    </div>
  );
}
