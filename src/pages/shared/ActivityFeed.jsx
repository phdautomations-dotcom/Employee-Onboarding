import { useMemo, useState } from 'react';
import { Card } from '../../components/common/Card.jsx';
import { ActivityTimeline } from '../../components/common/Timeline.jsx';
import SearchBar from '../../components/common/SearchBar.jsx';
import FilterSelect from '../../components/common/FilterSelect.jsx';
import { EmptyState } from '../../components/common/States.jsx';
import { useApp } from '../../context/AppContext.jsx';

const TYPES = ['application', 'review', 'approve', 'return', 'reject', 'interview', 'documents', 'offer', 'onboarding'];

export default function ActivityFeed() {
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
            (!t || a.title.toLowerCase().includes(t) || a.candidate.toLowerCase().includes(t) || (a.description || '').toLowerCase().includes(t))
          );
        }),
    [data.activities, q, type, getApplication]
  );

  return (
    <div className="page-body">
      <h1 className="page-title mb-4">Activity</h1>
      <div className="toolbar">
        <SearchBar value={q} onChange={setQ} placeholder="Search activity or candidate" />
        <FilterSelect label="Type" value={type} onChange={setType} options={TYPES.map((t) => ({ value: t, label: t[0].toUpperCase() + t.slice(1) }))} />
      </div>
      <Card>
        {items.length === 0 ? (
          <EmptyState icon="History" title="No activity found" message="Try changing your filters." />
        ) : (
          <ActivityTimeline
            items={items.map((a) => ({ ...a, description: a.candidate ? `${a.candidate} · ${a.description || ''}` : a.description }))}
          />
        )}
      </Card>
    </div>
  );
}
