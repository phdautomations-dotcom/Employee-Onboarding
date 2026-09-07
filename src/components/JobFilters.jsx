import Icon from './common/Icon.jsx';
import { EXPERIENCE_OPTIONS } from '../hooks/useJobFilters.js';

/* Search + filter row for the public job list. Takes the object from
   useJobFilters() and wires each control to it. */
export default function JobFilters({ f }) {
  const sel = (value, onChange, label, options) => (
    <select className="ta-input ta-input--select" style={{ width: 'auto', minWidth: 140 }} value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
      <option value="all">{label}: All</option>
      {options.map((o) => (typeof o === 'string'
        ? <option key={o} value={o}>{o}</option>
        : <option key={o.value} value={o.value}>{o.label}</option>))}
    </select>
  );

  return (
    <div className="ta-toolbar">
      <div className="ta-search ta-search--wide">
        <Icon name="Search" size={16} />
        <input value={f.q} placeholder="Search by job title, skill or keyword" onChange={(e) => f.setQ(e.target.value)} />
      </div>
      {sel(f.dept, f.setDept, 'Department', f.facets.departments)}
      {sel(f.mode, f.setMode, 'Location', f.facets.modes)}
      {sel(f.type, f.setType, 'Type', f.facets.types)}
      {sel(f.exp, f.setExp, 'Experience', EXPERIENCE_OPTIONS)}
    </div>
  );
}
