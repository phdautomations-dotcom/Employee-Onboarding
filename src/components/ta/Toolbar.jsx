import Icon from '../common/Icon.jsx';

/* Search box + filter selects in one row, with the active-filter chips below it.
   - `search`: { value, onChange, placeholder }
   - `filters`: [{ label, value, onChange, options: [{value,label}] }]
   - `chips`: [{ key, label, onRemove }]  + `onClearAll` */
export default function Toolbar({ search, filters = [], chips = [], onClearAll, action }) {
  return (
    <>
      <div className="ta-toolbar">
        <div className="ta-search ta-search--wide">
          <Icon name="Search" size={16} />
          <input
            value={search.value}
            placeholder={search.placeholder || 'Search…'}
            onChange={(e) => search.onChange(e.target.value)}
          />
        </div>
        {filters.map((f) => (
          <select key={f.label} className="ta-select" value={f.value} onChange={(e) => f.onChange(e.target.value)} aria-label={f.label}>
            <option value="all">{f.label}: All</option>
            {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}
        {action && <span className="ta-toolbar__action">{action}</span>}
      </div>

      {chips.length > 0 && (
        <div className="ta-chips">
          {chips.map((c) => (
            <span className="ta-chip" key={c.key}>
              {c.label}
              <button type="button" onClick={c.onRemove} aria-label={`Remove ${c.label}`}><Icon name="X" size={11} /></button>
            </span>
          ))}
          {onClearAll && <button type="button" className="ta-chip__clear" onClick={onClearAll}>Clear all</button>}
        </div>
      )}
    </>
  );
}
