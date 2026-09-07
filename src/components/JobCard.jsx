import { useNavigate } from 'react-router-dom';
import Icon from './common/Icon.jsx';
import Button from './ta/Button.jsx';

/* Roughly how long ago a job was posted (deadlines are ~30 days out). */
function postedAgo(deadline) {
  const d = new Date(deadline);
  d.setDate(d.getDate() - 30);
  const days = Math.max(1, Math.round((Date.now() - d.getTime()) / 86400000));
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  return `${Math.round(days / 30)} months ago`;
}

export default function JobCard({ job }) {
  const navigate = useNavigate();
  return (
    <article className="cx-job" onClick={() => navigate(`/candidate/jobs/${job.id}`)}>
      <span className="cx-job__icon"><Icon name="Briefcase" size={17} /></span>

      <div className="cx-job__body">
        <div className="cx-job__title">{job.title}</div>
        <div className="cx-job__dept">{job.department}</div>
        <div className="cx-job__meta">
          <span><Icon name="MapPin" size={12} /> {job.location}</span>
          <span><Icon name="BadgeCheck" size={12} /> {job.experience}</span>
          <span><Icon name="Clock3" size={12} /> {job.employmentType}</span>
        </div>
        <div className="cx-job__skills">
          {job.requiredSkills.slice(0, 4).map((s) => <span key={s} className="ta-skill">{s}</span>)}
        </div>
      </div>

      <div className="cx-job__side">
        <span className="cx-job__posted"><Icon name="CalendarDays" size={11} /> Posted {postedAgo(job.deadline)}</span>
        <div className="cx-job__actions" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" onClick={() => navigate(`/candidate/jobs/${job.id}`)}>View</Button>
          <Button iconRight="ArrowRight" onClick={() => navigate(`/candidate/apply/${job.id}`)}>Apply</Button>
        </div>
      </div>
    </article>
  );
}
