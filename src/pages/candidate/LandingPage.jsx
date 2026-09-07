import { useNavigate } from 'react-router-dom';
import Button from '../../components/ta/Button.jsx';
import EmptyState from '../../components/ta/EmptyState.jsx';
import JobCard from '../../components/JobCard.jsx';
import JobFilters from '../../components/JobFilters.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { useJobFilters } from '../../hooks/useJobFilters.js';

export default function LandingPage() {
  const navigate = useNavigate();
  const { jobs } = useApp();
  const f = useJobFilters(jobs);

  return (
    <div className="cx-page">
      <div className="cx-hero">
        <div>
          <div className="cx-hero__eyebrow">Talent Blooming Careers</div>
          <h1>Find your next opportunity</h1>
          <p>{jobs.length} open roles across {f.facets.departments.length} departments. Submit your profile and we'll match you to the right role.</p>
        </div>
        <Button icon="FileText" onClick={() => navigate('/candidate/apply')}>Submit general application</Button>
      </div>

      <JobFilters f={f} />

      {f.filtered.length === 0 ? (
        <EmptyState
          icon="SearchX"
          title="No opportunities match your filters"
          message="Try a different keyword or clear your filters."
          action={<Button variant="ghost" onClick={f.clear}>Clear filters</Button>}
        />
      ) : (
        <div className="cx-joblist">
          {f.filtered.map((job) => <JobCard key={job.id} job={job} />)}
        </div>
      )}
    </div>
  );
}
