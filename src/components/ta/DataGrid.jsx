import Icon from '../common/Icon.jsx';
import EmptyState from './EmptyState.jsx';
import Pager from './Pager.jsx';

/* Premium data table inside a card.
   - `columns`  : [{ key, label, sortable }]
   - `rows`     : array already sliced to the current page
   - `renderRow`: (row) => <tr>...</tr>
   - `sort`,`onSort` : optional sorting ({ key, dir })
   - `title`, `action` : optional card header
   - `pager`    : optional { page, pageSize, total, onPage } — shown above the table
   - `empty`    : props for EmptyState when there are no rows */
export default function DataGrid({ columns, rows, renderRow, sort, onSort, title, action, pager, empty }) {
  // Jump to the top of the page whenever the page number changes.
  const pagerProps = pager && {
    ...pager,
    onPage: (p) => { pager.onPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); },
  };

  return (
    <div className="ta-table-card">
      {(title || action) && (
        <div className="ta-table-card__head">
          {title && <div className="ta-card__title">{title}</div>}
          {action}
        </div>
      )}

      {pagerProps && rows.length > 0 && <Pager {...pagerProps} place="top" />}

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
