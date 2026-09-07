import { useNavigate } from 'react-router-dom';
import Icon from './common/Icon.jsx';
import Button from './common/Button.jsx';

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
    <article className="pjob">
      <span className="pjob__icon"><Icon name="Briefcase" size={16} /></span>

      <div className="pjob__body">
        <div className="pjob__title">{job.title}</div>
        <div className="pjob__dept">{job.department}</div>
        <div className="pjob__meta">
          <span><Icon name="MapPin" size={12} /> {job.location}</span>
          <span><Icon name="BadgeCheck" size={12} /> {job.experience}</span>
          <span><Icon name="Clock3" size={12} /> {job.employmentType}</span>
        </div>
        <div className="pjob__skills">
          {job.requiredSkills.slice(0, 4).map((s) => (
            <span className="skill-tag" key={s}>{s}</span>
          ))}
        </div>
      </div>

      <div className="pjob__side">
        <span className="pjob__posted">
          <Icon name="CalendarDays" size={11} /> Posted {postedAgo(job.deadline)}
        </span>
        <div className="pjob__actions">
          <Button variant="secondary" size="sm" onClick={() => navigate(`/candidate/jobs/${job.id}`)}>
            View Details
          </Button>
          <Button className="pjob__apply" variant="secondary" size="sm" iconRight="ArrowRight" onClick={() => navigate(`/candidate/apply/${job.id}`)}>
            Apply
          </Button>
        </div>
      </div>
    </article>
  );
}
