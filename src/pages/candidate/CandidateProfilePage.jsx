import { useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon.jsx';
import Button from '../../components/common/Button.jsx';
import { Card, InfoList } from '../../components/common/Card.jsx';
import { EmptyState } from '../../components/common/States.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { formatCurrencyINR } from '../../utils/format.js';

export default function CandidateProfilePage() {
  const navigate = useNavigate();
  const { data, getApplication } = useApp();
  const app = data.myApplicationId ? getApplication(data.myApplicationId) : null;

  if (!app) {
    return (
      <div className="cand csection" style={{ maxWidth: 720 }}>
        <EmptyState
          icon="UserRound"
          title="No profile yet"
          message="Apply to an opportunity and your profile details will be saved here."
          action={<Button icon="Briefcase" onClick={() => navigate('/candidate/jobs')}>Explore jobs</Button>}
        />
      </div>
    );
  }

  const p = app.personal;
  const pr = app.professional;

  return (
    <div className="cand csection" style={{ maxWidth: 860 }}>
      <div className="csection__head">
        <h2>My Profile</h2>
        <p>Details from your application — {app.candidateId}</p>
      </div>

      <Card className="mb-4">
        <div className="row gap-4 mb-4">
          <span className="avatar avatar--xl">{`${p.firstName[0] || ''}${p.lastName[0] || ''}`}</span>
          <div>
            <div className="section-title">{p.firstName} {p.lastName}</div>
            <div className="text-secondary text-small">{pr.currentJobTitle || 'Candidate'}{pr.currentCompany ? ` · ${pr.currentCompany}` : ''}</div>
          </div>
        </div>
        <InfoList
          items={[
            { label: 'Email', value: p.email },
            { label: 'Phone', value: p.mobile },
            { label: 'Current Location', value: p.currentLocation },
            { label: 'Total Experience', value: `${pr.totalExperience || '—'} years` },
            { label: 'Notice Period', value: pr.noticePeriod },
            { label: 'Expected Salary', value: formatCurrencyINR(pr.expectedCTC) },
          ]}
        />
      </Card>

      <Card title="Education & skills" className="mb-4">
        <InfoList
          items={[
            { label: 'Highest Qualification', value: app.education?.[0]?.qualification },
            { label: 'Skills', value: pr.skills?.join(', ') },
          ]}
        />
      </Card>

      <div className="row gap-3">
        <Button icon="ClipboardList" onClick={() => navigate('/candidate/application')}>
          View my application
        </Button>
        <Button variant="secondary" icon="Briefcase" onClick={() => navigate('/candidate/jobs')}>
          Browse jobs
        </Button>
      </div>
    </div>
  );
}
