import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import JobCard from '../../components/JobCard.jsx';
import Button from '../../components/common/Button.jsx';
import SearchBar from '../../components/common/SearchBar.jsx';
import FilterSelect from '../../components/common/FilterSelect.jsx';
import { EmptyState } from '../../components/common/States.jsx';
import { useApp } from '../../context/AppContext.jsx';

export default function JobsPage() {
  const navigate = useNavigate();
  const { jobs: JOBS } = useApp();
  const [q, setQ] = useState('');
  const [dept, setDept] = useState('all');
  const [mode, setMode] = useState('all');
  const [type, setType] = useState('all');
  const [exp, setExp] = useState('all');

  const departments = useMemo(() => [...new Set(JOBS.map((j) => j.department))], [JOBS]);
  const modes = useMemo(() => [...new Set(JOBS.map((j) => j.workMode))], [JOBS]);
  const types = useMemo(() => [...new Set(JOBS.map((j) => j.employmentType))], [JOBS]);

  const filtered = useMemo(
    () =>
      JOBS.filter((j) => {
        const t = q.trim().toLowerCase();
        const match =
          !t ||
          j.title.toLowerCase().includes(t) ||
          j.department.toLowerCase().includes(t) ||
          j.requiredSkills.some((s) => s.toLowerCase().includes(t));
        const minExp = parseInt(j.experience, 10) || 0;
        const expOk =
          exp === 'all' ||
          (exp === 'junior' && minExp <= 3) ||
          (exp === 'mid' && minExp >= 3 && minExp <= 6) ||
          (exp === 'senior' && minExp >= 6);
        return match && expOk && (dept === 'all' || j.department === dept) && (mode === 'all' || j.workMode === mode) && (type === 'all' || j.employmentType === type);
      }),
    [JOBS, q, dept, mode, type, exp]
  );

  const clear = () => { setQ(''); setDept('all'); setMode('all'); setType('all'); setExp('all'); };

  return (
    <div className="cand csection">
      <div className="csection__head row between wrap gap-3">
        <div>
          <h2>Open Positions</h2>
          <p>{filtered.length} of {JOBS.length} roles match your search</p>
        </div>
        <Button variant="secondary" icon="FileText" onClick={() => navigate('/candidate/apply')}>
          Submit General Application
        </Button>
      </div>

      <div className="filter-bar">
        <SearchBar value={q} onChange={setQ} placeholder="Search jobs by title, skill or keyword" />
        <FilterSelect label="Department" value={dept} onChange={setDept} options={departments} />
        <FilterSelect label="Location" value={mode} onChange={setMode} options={modes} />
        <FilterSelect label="Type" value={type} onChange={setType} options={types} />
        <FilterSelect
          label="Experience"
          value={exp}
          onChange={setExp}
          options={[
            { value: 'junior', label: '0–3 years' },
            { value: 'mid', label: '3–6 years' },
            { value: 'senior', label: '6+ years' },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="SearchX"
          title="No opportunities match your filters"
          message="Try a different keyword or clear your filters."
          action={<Button variant="secondary" onClick={clear}>Clear Filters</Button>}
        />
      ) : (
        <div className="pjob-list">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
