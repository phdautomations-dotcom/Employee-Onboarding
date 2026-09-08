import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TAHeader from '../../components/ta/TAHeader.jsx';
import Card from '../../components/ta/Card.jsx';
import Toolbar from '../../components/ta/Toolbar.jsx';
import EmptyState from '../../components/ta/EmptyState.jsx';
import { ActivityTimeline } from '../../components/common/Timeline.jsx';
import { useApp } from '../../context/AppContext.jsx';

const cap = (s) => s[0].toUpperCase() + s.slice(1);

/* The events that matter to each role. HR doesn't need the TA-side application /
   review / interview noise — its job starts at document verification. */
const SCOPE_TYPES = {
  hr: ['onboarding', 'documents', 'offer'],
  ta: ['application', 'review', 'approve', 'return', 'reject', 'interview', 'documents', 'offer', 'onboarding'],
};

/* `base` is the role's route prefix ('/hr' or '/ta') so a row opens that role's
   candidate page; `scope` picks which event types are relevant by default. */
export default function ActivityFeed({ base = '/hr', scope = 'hr' }) {
  const navigate = useNavigate();
  const { data, getApplication } = useApp();
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');

  const scopeTypes = SCOPE_TYPES[scope] || SCOPE_TYPES.ta;

  const all = useMemo(
    () =>
      (data.activities || [])
        .filter((a) => scopeTypes.includes(a.type))
        .map((a) => {
          const app = getApplication(a.applicationId);
          const candidate = app ? `${app.personal.firstName} ${app.personal.lastName}` : '';
          return { ...a, candidate, description: candidate ? `${candidate} — ${a.description || ''}` : a.description };
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

  const last7 = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400000;
    return all.filter((a) => new Date(a.at).getTime() >= cutoff).length;
  }, [all]);

  const chips = [
    type !== 'all' && { key: 'type', label: cap(type), onRemove: () => setType('all') },
    q && { key: 'q', label: `“${q}”`, onRemove: () => setQ('') },
  ].filter(Boolean);

  const isHr = scope === 'hr';

  return (
    <>
      <TAHeader
        title={isHr ? 'Onboarding Activity' : 'Activity'}
        subtitle={
          isHr
            ? `Documents, offers and joining events across every candidate — ${last7} in the last 7 days.`
            : `Every recorded action across recruitment and onboarding — ${last7} in the last 7 days.`
        }
      />

      <Toolbar
        search={{ value: q, onChange: setQ, placeholder: 'Search by candidate or action…' }}
        filters={[{ label: 'Type', value: type, onChange: setType, options: scopeTypes.map((s) => ({ value: s, label: cap(s) })) }]}
        chips={chips}
        onClearAll={chips.length > 1 ? () => { setQ(''); setType('all'); } : undefined}
      />

      <Card>
        {items.length === 0 ? (
          <EmptyState icon="History" title="No activity found" message="Try clearing the filters." />
        ) : (
          <ActivityTimeline
            items={items.slice(0, 80)}
            onSelect={(it) => {
              const app = getApplication(it.applicationId);
              navigate(app ? `${base}/candidates/${app.candidateId}` : `${base}/candidates`);
            }}
          />
        )}
      </Card>
    </>
  );
}
