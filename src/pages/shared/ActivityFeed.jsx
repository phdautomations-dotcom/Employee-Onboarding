import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TAHeader from '../../components/ta/TAHeader.jsx';
import Card from '../../components/ta/Card.jsx';
import Toolbar from '../../components/ta/Toolbar.jsx';
import EmptyState from '../../components/ta/EmptyState.jsx';
import { ActivityTimeline } from '../../components/common/Timeline.jsx';
import { useApp } from '../../context/AppContext.jsx';

const TYPES = ['application', 'review', 'approve', 'return', 'reject', 'interview', 'documents', 'offer', 'onboarding'];
const cap = (s) => s[0].toUpperCase() + s.slice(1);

/* Full activity log. `base` is the role's route prefix so a row opens that
   role's candidate page ('/hr' or '/ta'). */
export default function ActivityFeed({ base = '/hr' }) {
  const navigate = useNavigate();
  const { data, getApplication } = useApp();
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');

  const items = useMemo(
    () =>
      (data.activities || [])
        .map((a) => {
          const app = getApplication(a.applicationId);
          return { ...a, candidate: app ? `${app.personal.firstName} ${app.personal.lastName}` : '' };
        })
        .filter((a) => {
          const t = q.trim().toLowerCase();
          return (
            (type === 'all' || a.type === type) &&
            (!t
              || a.title.toLowerCase().includes(t)
              || a.candidate.toLowerCase().includes(t)
              || (a.description || '').toLowerCase().includes(t))
          );
        }),
    [data.activities, q, type, getApplication]
  );

  const chips = [
    type !== 'all' && { key: 'type', label: cap(type), onRemove: () => setType('all') },
    q && { key: 'q', label: `“${q}”`, onRemove: () => setQ('') },
  ].filter(Boolean);

  return (
    <>
      <TAHeader title="Activity" subtitle="Every recorded action across recruitment and onboarding." />

      <Toolbar
        search={{ value: q, onChange: setQ, placeholder: 'Search activity or candidate…' }}
        filters={[{ label: 'Type', value: type, onChange: setType, options: TYPES.map((t) => ({ value: t, label: cap(t) })) }]}
        chips={chips}
        onClearAll={chips.length > 1 ? () => { setQ(''); setType('all'); } : undefined}
      />

      <Card>
        {items.length === 0 ? (
          <EmptyState icon="History" title="No activity found" message="Try changing the filters." />
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
