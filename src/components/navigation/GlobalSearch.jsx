import { useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../common/Icon.jsx';
import { useApp } from '../../context/AppContext.jsx';

/* Topbar search. Scoped to the section you're in: on an Employees page it
   searches employees, everywhere else it searches candidates/applications.
   Every result opens the matching candidate/employee detail page. */
export default function GlobalSearch({ base, variant, placeholder }) {
  const { data, getApplication } = useApp();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const barClass = variant === 'ta' ? 'ta-search' : 'search-bar';

  const empMode = pathname.includes('/employees');
  const ph = placeholder || (empMode ? 'Search employees…' : 'Search candidates, IDs, roles…');

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    if (empMode) {
      return (data.employees || [])
        .filter((e) =>
          (e.name || '').toLowerCase().includes(term) ||
          (e.id || '').toLowerCase().includes(term) ||
          (e.position || '').toLowerCase().includes(term) ||
          (e.department || '').toLowerCase().includes(term))
        .slice(0, 8)
        .map((e) => ({
          key: e.id,
          primary: e.name,
          secondary: `${e.id} · ${e.position}`,
          to: `${base}/candidates/${getApplication(e.applicationId)?.candidateId || ''}`,
        }));
    }
    return (data.applications || [])
      .filter((a) => {
        const name = `${a.personal.firstName} ${a.personal.lastName}`.toLowerCase();
        return (
          name.includes(term) ||
          a.candidateId.toLowerCase().includes(term) ||
          a.id.toLowerCase().includes(term) ||
          (a.jobTitle || '').toLowerCase().includes(term) ||
          (a.personal.email || '').toLowerCase().includes(term)
        );
      })
      .slice(0, 8)
      .map((a) => ({
        key: a.id,
        primary: `${a.personal.firstName} ${a.personal.lastName}`,
        secondary: `${a.candidateId} · ${a.jobTitle}`,
        to: `${base}/candidates/${a.candidateId}`,
      }));
  }, [q, empMode, data.applications, data.employees, base, getApplication]);

  return (
    <div className="global-search" ref={ref} style={variant === 'ta' ? undefined : { minWidth: 280 }}>
      <div className={barClass}>
        <Icon name="Search" size={16} />
        <input
          value={q}
          placeholder={ph}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      </div>
      {open && q.trim() && (
        <div className="global-search__results">
          {results.length === 0 && <div className="global-search__item text-secondary">No matches found.</div>}
          {results.map((r) => (
            <div
              key={r.key}
              className="global-search__item"
              onMouseDown={() => { navigate(r.to); setQ(''); setOpen(false); }}
            >
              <div className="strong text-small">{r.primary}</div>
              <div className="text-xs text-secondary">{r.secondary}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
