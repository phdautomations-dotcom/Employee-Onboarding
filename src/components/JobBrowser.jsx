import Icon from './common/Icon.jsx';
import Button from './ta/Button.jsx';
import EmptyState from './ta/EmptyState.jsx';
import JobCard from './JobCard.jsx';
import JobFilters from './JobFilters.jsx';
import { useLoadMore } from '../hooks/useLoadMore.js';

/* Job browser: one search bar on top, then the list on the left and the filter
   panel on the right. Shared by the careers landing page and the jobs page.
   The list shows 30 roles at a time behind a "Load more" button. */
export default function JobBrowser({ f }) {
  const list = useLoadMore(f.filtered, 30);
  return (
    <>
      <div className="cx-jobsearch">
        <Icon name="Search" size={17} />
        <input
          value={f.q}
          placeholder="Search jobs by title, skill or keyword"
          onChange={(e) => f.setQ(e.target.value)}
        />
        {f.q && (
          <button type="button" className="cx-jobsearch__clear" onClick={() => f.setQ('')} aria-label="Clear search">
            <Icon name="X" size={14} />
          </button>
        )}
      </div>

      <div className="cx-jobs-grid">
        <div className="cx-jobs-grid__main">
          {f.filtered.length === 0 ? (
            <EmptyState
              icon="SearchX"
              title="No roles match your filters"
              message="Try a different keyword or clear the filters."
              action={<Button variant="ghost" onClick={f.clear}>Clear filters</Button>}
            />
          ) : (
            <>
              <div className="cx-joblist">
                {list.rows.map((job) => <JobCard key={job.id} job={job} />)}
              </div>
              {list.hasMore && (
                <div className="ta-loadmore">
                  <span>Showing {list.shown} of {list.total}</span>
                  <Button variant="ghost" onClick={list.loadMore}>
                    Load {Math.min(list.step, list.total - list.shown)} more
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
        <JobFilters f={f} />
      </div>
    </>
  );
}
