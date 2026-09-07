import { useNavigate, useParams } from 'react-router-dom';
import Icon from '../../components/common/Icon.jsx';
import Button from '../../components/common/Button.jsx';
import { EmptyState } from '../../components/common/States.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { formatDate } from '../../utils/format.js';

function Block({ title, items }) {
  if (!items?.length) return null;
  return (
    <div className="mb-6">
      <h3 className="section-title mb-3">{title}</h3>
      <ul style={{ margin: 0, paddingLeft: 18 }} className="text-small stack gap-2 text-secondary">
        {items.map((i) => <li key={i}>{i}</li>)}
      </ul>
    </div>
  );
}

export default function JobDetailsPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { getJob } = useApp();
  const job = getJob(jobId);

  if (!job) {
    return (
      <div className="cand csection">
        <EmptyState icon="SearchX" title="Job not found" action={<Button onClick={() => navigate('/candidate/jobs')}>Back to all jobs</Button>} />
      </div>
    );
  }

  const meta = [
    { icon: 'Building2', label: 'Department', value: job.department },
    { icon: 'MapPin', label: 'Location', value: job.location },
    { icon: 'Briefcase', label: 'Employment', value: `${job.employmentType} · ${job.workMode}` },
    { icon: 'BadgeCheck', label: 'Experience', value: job.experience },
    { icon: 'CalendarDays', label: 'Apply by', value: formatDate(job.deadline) },
  ];

  return (
    <div className="cand csection">
      <Button variant="ghost" icon="ArrowLeft" onClick={() => navigate('/candidate/jobs')}>
        All jobs
      </Button>

      <div className="apply-grid mt-4">
        <div>
          <span className="pjob__dept">{job.department}</span>
          <h1 className="page-title" style={{ fontSize: 30, marginTop: 4 }}>{job.title}</h1>
          <div className="pjob__meta mt-3 mb-6">
            <span><Icon name="MapPin" size={13} /> {job.location}</span>
            <span><Icon name="BadgeCheck" size={13} /> {job.experience}</span>
            <span><Icon name="Briefcase" size={13} /> {job.employmentType}</span>
            <span><Icon name="Hash" size={13} /> {job.id}</span>
          </div>

          <div className="mb-6">
            <h3 className="section-title mb-3">About the Role</h3>
            <p className="text-small text-secondary">{job.description}</p>
          </div>
          <Block title="Responsibilities" items={job.responsibilities} />
          <div className="mb-6">
            <h3 className="section-title mb-3">Required Skills</h3>
            <div className="job-card__skills">
              {job.requiredSkills.map((s) => <span className="skill-tag" key={s}>{s}</span>)}
            </div>
          </div>
          <div className="mb-6">
            <h3 className="section-title mb-3">Preferred Skills</h3>
            <div className="job-card__skills">
              {job.preferredSkills.map((s) => <span className="skill-tag" key={s}>{s}</span>)}
            </div>
          </div>
          <Block title="Qualifications" items={job.qualifications} />
          <Block title="What We Offer" items={job.benefits} />
        </div>

        <div className="apply-summary">
          <div className="apply-summary__head">
            <div className="strong">Ready to apply?</div>
            <div className="text-xs text-secondary">Takes about 2 minutes with your resume.</div>
          </div>
          <div className="apply-summary__body">
            {meta.map((m) => (
              <div className="apply-summary__row" key={m.label}>
                <span className="k"><Icon name={m.icon} size={13} /> {m.label}</span>
                <span className="v">{m.value}</span>
              </div>
            ))}
            <Button block className="mt-4" icon="ArrowRight" onClick={() => navigate(`/candidate/apply/${job.id}`)}>
              Apply Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
