import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../common/Icon.jsx';
import { useApp } from '../../context/AppContext.jsx';

export default function GlobalSearch({ base, variant, placeholder = 'Search candidates, IDs, jobs, email…' }) {
  const { data } = useApp();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const barClass = variant === 'ta' ? 'ta-search' : 'search-bar';

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
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
      .slice(0, 8);
  }, [q, data.applications]);

  return (
    <div
      className="global-search"
      ref={ref}
      style={variant === 'ta' ? undefined : { minWidth: 280 }}
    >
      <div className={barClass}>
        <Icon name="Search" size={16} />
        <input
          value={q}
          placeholder={placeholder}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      </div>
      {open && q.trim() && (
        <div className="global-search__results">
          {results.length === 0 && <div className="global-search__item text-secondary">No matches found.</div>}
          {results.map((a) => (
            <div
              key={a.id}
              className="global-search__item"
              onMouseDown={() => {
                navigate(`${base}/candidates/${a.candidateId}`);
                setQ('');
                setOpen(false);
              }}
            >
              <div className="strong text-small">
                {a.personal.firstName} {a.personal.lastName}
              </div>
              <div className="text-xs text-secondary">
                {a.candidateId} · {a.jobTitle} · {a.id}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
