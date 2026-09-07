import Icon from './Icon.jsx';
import { formatDateTime } from '../../utils/format.js';

const TYPE_ICON = {
  application: 'FileText',
  review: 'Eye',
  approve: 'CheckCircle2',
  return: 'RotateCcw',
  reject: 'XCircle',
  interview: 'CalendarDays',
  documents: 'Files',
  offer: 'FileCheck',
  onboarding: 'UserRoundCheck',
};

export function ActivityTimeline({ items }) {
  if (!items?.length) {
    return <p className="text-secondary text-small">No activity recorded yet.</p>;
  }
  return (
    <div className="timeline">
      {items.map((it) => (
        <div className="timeline__item" key={it.id}>
          <div className="timeline__dot">
            <Icon name={TYPE_ICON[it.type] || 'CircleDot'} size={16} />
          </div>
          <div className="timeline__content">
            <div className="timeline__title">{it.title}</div>
            {it.description && <div className="text-small text-secondary">{it.description}</div>}
            <div className="timeline__meta">
              {formatDateTime(it.at)} · {it.actor}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Pipeline stage tracker for the candidate. */
export function StageTracker({ stages }) {
  return (
    <div className="timeline">
      {stages.map((s) => (
        <div className="timeline__item" key={s.key}>
          <div className={`timeline__dot timeline__dot--${s.state}`}>
            <Icon
              name={s.state === 'done' ? 'Check' : s.state === 'current' ? 'CircleDot' : 'Circle'}
              size={16}
            />
          </div>
          <div className="timeline__content">
            <div className="timeline__title">{s.label}</div>
            <div className="text-small text-secondary">{s.description}</div>
            {s.date && <div className="timeline__meta">{s.date}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
