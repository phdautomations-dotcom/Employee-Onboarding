import Icon from '../common/Icon.jsx';
import EmptyState from './EmptyState.jsx';

/* Premium data table inside a card.
   - `columns`  : [{ key, label, sortable }]
   - `rows`     : array already sliced to the current page
   - `renderRow`: (row) => <tr>...</tr>
   - `sort`,`onSort` : optional sorting ({ key, dir })
   - `title`, `action` : optional card header
   - `empty`    : props for EmptyState when there are no rows
   Pagination lives on the Toolbar row now, not here. */
export default function DataGrid({ columns, rows, renderRow, sort, onSort, title, action, empty }) {
  return (
    <div className="ta-table-card">
      {(title || action) && (
        <div className="ta-table-card__head">
          {title && <div className="ta-card__title">{title}</div>}
          {action}
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState {...(empty || { title: 'Nothing to show', message: 'Try changing the filters or search.' })} />
      ) : (
        <div className="ta-table-scroll">
          <table className="ta-table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={c.sortable ? 'sortable' : undefined}
                    onClick={c.sortable && onSort ? () => onSort(c.key) : undefined}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {c.label}
                      {c.sortable && sort?.key === c.key && (
                        <Icon name={sort.dir === 'asc' ? 'ArrowUp' : 'ArrowDown'} size={12} />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{rows.map(renderRow)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
