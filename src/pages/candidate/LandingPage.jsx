import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button.jsx';
import JobCard from '../../components/JobCard.jsx';
import SearchBar from '../../components/common/SearchBar.jsx';
import FilterSelect from '../../components/common/FilterSelect.jsx';
import { EmptyState } from '../../components/common/States.jsx';
import { useApp } from '../../context/AppContext.jsx';

export default function LandingPage() {
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
          (exp === 'mid' && minExp > 3 && minExp <= 6) ||
          (exp === 'senior' && minExp > 6);
        return match && expOk && (dept === 'all' || j.department === dept) && (mode === 'all' || j.workMode === mode) && (type === 'all' || j.employmentType === type);
      }),
    [JOBS, q, dept, mode, type, exp]
  );

  const clearFilters = () => { setQ(''); setDept('all'); setMode('all'); setType('all'); setExp('all'); };

  return (
    <div className="cand">
      <section className="chero">
        <span className="chero__blob chero__blob--a" />
        <span className="chero__blob chero__blob--b" />
        <div className="chero__inner">
          <div>
            <span className="chero__eyebrow">TALENTFLOW CAREERS</span>
            <h1>Find your next opportunity</h1>
            <p>Explore open roles and apply in minutes.</p>
            <div className="chero__strip">
              <b>{JOBS.length} open roles</b> <span className="sep" /> {departments.length} departments <span className="sep" /> Full-time &amp; hybrid
            </div>
          </div>

          <div className="apply-panel">
            <div className="apply-panel__title">Ready to apply?</div>
            <div className="apply-panel__sub">Apply faster with your resume.</div>
            <Button icon="UploadCloud" onClick={() => navigate('/candidate/apply')}>
              Apply with Resume
            </Button>
            <Button variant="secondary" icon="FileText" onClick={() => navigate('/candidate/apply')}>
              General Application
            </Button>
          </div>
        </div>
      </section>

      <section className="csection csection--tight">
        <div className="csection__head">
          <h2>Open Positions</h2>
          <p>Explore roles currently available at TalentFlow.</p>
        </div>

        <div className="filter-bar">
          <SearchBar value={q} onChange={setQ} placeholder="Search by job title, skill or keyword" />
          <FilterSelect label="Department" value={dept} onChange={setDept} options={departments} />
          <FilterSelect label="Location" value={mode} onChange={setMode} options={modes} />
          <FilterSelect
            label="Experience"
            value={exp}
            onChange={setExp}
            options={[
              { value: 'junior', label: '0–3 yrs' },
              { value: 'mid', label: '3–6 yrs' },
              { value: 'senior', label: '6+ yrs' },
            ]}
          />
          <FilterSelect label="Type" value={type} onChange={setType} options={types} />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon="SearchX"
            title="No opportunities match your filters"
            message="Try a different keyword or clear your filters."
            action={<Button variant="secondary" onClick={clearFilters}>Clear Filters</Button>}
          />
        ) : (
          <div className="pjob-list">
            {filtered.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
