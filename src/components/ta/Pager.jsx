import Icon from '../common/Icon.jsx';

/* Premium pagination: "Showing 1–10 of 248" + numbered controls with ellipsis. */
export default function Pager({ page, pageSize, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  const nums = [];
  for (let p = 1; p <= pages; p += 1) {
    if (p === 1 || p === pages || Math.abs(p - page) <= 1) nums.push(p);
    else if (nums[nums.length - 1] !== '…') nums.push('…');
  }

  return (
    <div className="ta-pager">
      <span>Showing {from}–{to} of {total}</span>
      <div className="ta-pager__nums">
        <button className="ta-pager__btn" onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page">
          <Icon name="ChevronLeft" size={14} />
        </button>
        {nums.map((n, i) =>
          n === '…' ? (
            <span key={`gap${i}`} style={{ padding: '0 4px' }}>…</span>
          ) : (
            <button
              key={n}
              className={`ta-pager__btn${n === page ? ' ta-pager__btn--active' : ''}`}
              onClick={() => onPage(n)}
            >
              {n}
            </button>
          )
        )}
        <button className="ta-pager__btn" onClick={() => onPage(page + 1)} disabled={page >= pages} aria-label="Next page">
          <Icon name="ChevronRight" size={14} />
        </button>
      </div>
    </div>
  );
}
