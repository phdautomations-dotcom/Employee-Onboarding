import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TAHeader from '../../components/ta/TAHeader.jsx';
import Card from '../../components/ta/Card.jsx';
import StatBar from '../../components/ta/StatBar.jsx';
import Toolbar from '../../components/ta/Toolbar.jsx';
import EmptyState from '../../components/ta/EmptyState.jsx';
import Icon from '../../components/common/Icon.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { APP_STATUS } from '../../constants/statuses.js';

const cap = (s) => s[0].toUpperCase() + s.slice(1);

const SCOPE_TYPES = {
  hr: ['onboarding', 'documents', 'offer'],
  ta: ['application', 'review', 'approve', 'return', 'reject', 'interview', 'documents', 'offer', 'onboarding'],
};

/* Pick a vivid icon + colour from the wording of the event, so the feed reads
   at a glance (green = went well, red = blocked, violet = joining). */
function eventMeta(title = '') {
  const t = title.toLowerCase();
  if (t.includes('reject') || t.includes('return') || t.includes('fail')) return { icon: 'XCircle', tone: 'red' };
  if (t.includes('verif') || t.includes('accepted') || t.includes('approved') || t.includes('passed') || t.includes('completed')) return { icon: 'CheckCircle2', tone: 'green' };
  if (t.includes('joining') || t.includes('employee') || t.includes('onboarded')) return { icon: 'Rocket', tone: 'violet' };
  if (t.includes('offer')) return { icon: 'FileCheck', tone: 'blue' };
  if (t.includes('document')) return { icon: 'Files', tone: 'teal' };
  if (t.includes('submitted') || t.includes('upload') || t.includes('applied')) return { icon: 'Upload', tone: 'blue' };
  if (t.includes('interview') || t.includes('scheduled')) return { icon: 'CalendarDays', tone: 'amber' };
  return { icon: 'CircleDot', tone: 'grey' };
}

function dayBucket(dateStr) {
  const start = (x) => { const d = new Date(x); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const diff = Math.round((start(Date.now()) - start(dateStr)) / 86400000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'long' });
  return new Date(dateStr).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

const shortTime = (d) =>
  new Date(d).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }).toLowerCase();

export default function ActivityFeed({ base = '/hr', scope = 'hr' }) {
  const navigate = useNavigate();
  const { data, getApplication } = useApp();
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');

  const scopeTypes = SCOPE_TYPES[scope] || SCOPE_TYPES.ta;
  const apps = data.applications || [];

  const all = useMemo(
    () =>
      (data.activities || [])
        .filter((a) => scopeTypes.includes(a.type))
        .map((a) => {
          const app = getApplication(a.applicationId);
          return { ...a, candidate: app ? `${app.personal.firstName} ${app.personal.lastName}` : '' };
        }),
    [data.activities, scopeTypes, getApplication]
  );

  const items = useMemo(() => {
    const t = q.trim().toLowerCase();
    return all.filter(
      (a) =>
        (type === 'all' || a.type === type) &&
        (!t || a.title.toLowerCase().includes(t) || a.candidate.toLowerCase().includes(t) || (a.description || '').toLowerCase().includes(t))
    );
  }, [all, q, type]);

  const groups = useMemo(() => {
    const out = [];
    items.forEach((it) => {
      const key = dayBucket(it.at);
      let g = out.find((x) => x.key === key);
      if (!g) { g = { key, items: [] }; out.push(g); }
      g.items.push(it);
    });
    return out;
  }, [items]);

  // Activity by week over the last ~10 weeks.
  const spark = useMemo(() => {
    const weeks = [];
    for (let i = 9; i >= 0; i -= 1) {
      const end = new Date(); end.setHours(0, 0, 0, 0); end.setDate(end.getDate() - i * 7 + 1);
      const start = end.getTime() - 7 * 86400000;
      weeks.push({ end, count: all.filter((a) => { const t = new Date(a.at).getTime(); return t >= start && t < end.getTime(); }).length });
    }
    return weeks;
  }, [all]);
  const sparkMax = Math.max(1, ...spark.map((d) => d.count));
  const last7 = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400000;
    return all.filter((a) => new Date(a.at).getTime() >= cutoff).length;
  }, [all]);

  const stats = scope === 'hr'
    ? [
        { icon: 'Activity', accent: 'blue', label: 'Events this week', value: last7 },
        { icon: 'ClipboardCheck', accent: 'amber', label: 'Awaiting verification', value: apps.filter((a) => a.status === APP_STATUS.HR_VERIFICATION).length },
        { icon: 'FileCheck', accent: 'teal', label: 'Offers awaiting reply', value: apps.filter((a) => a.status === APP_STATUS.OFFER_ISSUED).length },
        { icon: 'Rocket', accent: 'green', label: 'Onboarded', value: (data.employees || []).length },
      ]
    : [{ icon: 'Activity', accent: 'blue', label: 'Events this week', value: last7 }];

  const chips = [
    type !== 'all' && { key: 'type', label: cap(type), onRemove: () => setType('all') },
    q && { key: 'q', label: `“${q}”`, onRemove: () => setQ('') },
  ].filter(Boolean);

  const open = (it) => {
    const app = getApplication(it.applicationId);
    navigate(app ? `${base}/candidates/${app.candidateId}` : `${base}/candidates`);
  };

  const isHr = scope === 'hr';

  return (
    <>
      <TAHeader
        title={isHr ? 'Onboarding Activity' : 'Activity'}
        subtitle={isHr ? 'Documents, offers and joining — everything happening across your candidates.' : 'Every recorded action across recruitment and onboarding.'}
      />

      <StatBar items={stats} />

      <Card title="Activity by week" action={<span className="ta-cell-sub">{all.length} events all time</span>}>
        <div className="act-spark">
          {spark.map((d, i) => (
            <div
              className={`act-spark__col${i === spark.length - 1 ? ' act-spark__col--today' : ''}`}
              key={i}
              title={`${d.count} event${d.count === 1 ? '' : 's'} · week of ${new Date(d.end.getTime() - 6 * 86400000).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`}
            >
              <span className="act-spark__bar" style={{ height: `${Math.max(4, (d.count / sparkMax) * 100)}%` }} />
            </div>
          ))}
        </div>
        <div className="act-spark__axis"><span>10 weeks ago</span><span>this week</span></div>
      </Card>

      <Toolbar
        search={{ value: q, onChange: setQ, placeholder: 'Search by candidate or action…' }}
        filters={[{ label: 'Type', value: type, onChange: setType, options: scopeTypes.map((s) => ({ value: s, label: cap(s) })) }]}
        chips={chips}
        onClearAll={chips.length > 1 ? () => { setQ(''); setType('all'); } : undefined}
      />

      {items.length === 0 ? (
        <Card><EmptyState icon="History" title="No activity found" message="Try clearing the filters." /></Card>
      ) : (
        <Card>
          {groups.map((g) => (
            <div className="act-day" key={g.key}>
              <div className="act-day__label">{g.key}<span className="act-day__count">{g.items.length}</span></div>
              <div className="act-feed">
                {g.items.map((it, i) => {
                  const m = eventMeta(it.title);
                  const showActor = it.actor && it.actor !== it.candidate;
                  return (
                    <button
                      key={it.id}
                      type="button"
                      className="act-feed__item act-feed__item--link"
                      style={{ animationDelay: `${Math.min(i, 10) * 22}ms` }}
                      onClick={() => open(it)}
                    >
                      <span className={`act-feed__icon act-feed__icon--${m.tone}`}><Icon name={m.icon} size={15} /></span>
                      <div className="act-feed__body">
                        <div className="act-feed__head">
                          <span className="act-feed__title">
                            {it.title}
                            {it.candidate && <span className="act-feed__cand"> · {it.candidate}</span>}
                          </span>
                          <span className="act-feed__when">{shortTime(it.at)}</span>
                        </div>
                        <div className="act-feed__desc">
                          {it.description}
                          {showActor && <span className="act-feed__actor"> · by {it.actor}</span>}
                        </div>
                      </div>
                      <Icon name="ChevronRight" size={16} className="act-feed__go" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}
