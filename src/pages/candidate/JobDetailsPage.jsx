import { useNavigate, useParams } from 'react-router-dom';
import Icon from '../../components/common/Icon.jsx';
import Button from '../../components/ta/Button.jsx';
import Card from '../../components/ta/Card.jsx';
import EmptyState from '../../components/ta/EmptyState.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { formatDate } from '../../utils/format.js';

function List({ title, items }) {
  if (!items?.length) return null;
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 className="ta-card__title" style={{ marginBottom: 10 }}>{title}</h3>
      <ul className="ta-bullets">{items.map((i) => <li key={i}>{i}</li>)}</ul>
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
      <div className="cx-page">
        <EmptyState icon="SearchX" title="Job not found"
          action={<Button variant="ghost" onClick={() => navigate('/candidate/jobs')}>Back to all jobs</Button>} />
      </div>
    );
  }

  const meta = [
    { label: 'Department', value: job.department },
    { label: 'Location', value: job.location },
    { label: 'Employment', value: `${job.employmentType} · ${job.workMode}` },
    { label: 'Experience', value: job.experience },
    { label: 'Apply by', value: formatDate(job.deadline) },
  ];

  return (
    <div className="cx-page">
      <button className="ta-link" onClick={() => navigate('/candidate/jobs')} style={{ marginBottom: 14 }}>
        <Icon name="ArrowLeft" size={14} /> All jobs
      </button>

      <div className="cx-page__head">
        <span className="ta-cell-sub">{job.department} · {job.id}</span>
        <h1 className="cx-page__title" style={{ marginTop: 2 }}>{job.title}</h1>
        <p className="cx-page__sub">{job.location} · {job.employmentType} · {job.workMode}</p>
      </div>

      <div className="ta-detail-grid">
        <Card>
          <div style={{ marginBottom: 20 }}>
            <h3 className="ta-card__title" style={{ marginBottom: 10 }}>About the role</h3>
            <p className="ta-cell-mute" style={{ lineHeight: 1.7 }}>{job.description}</p>
          </div>
          <List title="Responsibilities" items={job.responsibilities} />
          {job.requiredSkills?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h3 className="ta-card__title" style={{ marginBottom: 10 }}>Required skills</h3>
              <div className="ta-skills">{job.requiredSkills.map((s) => <span key={s} className="ta-skill">{s}</span>)}</div>
            </div>
          )}
          {job.preferredSkills?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h3 className="ta-card__title" style={{ marginBottom: 10 }}>Preferred skills</h3>
              <div className="ta-skills">{job.preferredSkills.map((s) => <span key={s} className="ta-skill">{s}</span>)}</div>
            </div>
          )}
          <List title="Qualifications" items={job.qualifications} />
          <List title="What we offer" items={job.benefits} />
        </Card>

        <Card title="Ready to apply?">
          <p className="ta-cell-sub" style={{ marginBottom: 14 }}>Takes about 2 minutes with your resume.</p>
          <div className="ta-info ta-info--1" style={{ marginBottom: 16 }}>
            {meta.map((m) => (
              <div className="ta-info__item" key={m.label}>
                <span className="ta-info__label">{m.label}</span>
                <span className="ta-info__value">{m.value}</span>
              </div>
            ))}
          </div>
          <Button iconRight="ArrowRight" onClick={() => navigate(`/candidate/apply/${job.id}`)} style={{ width: '100%' }}>
            Apply now
          </Button>
        </Card>
      </div>
    </div>
  );
}
