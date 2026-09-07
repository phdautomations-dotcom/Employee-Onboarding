import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon.jsx';
import Button from '../../components/common/Button.jsx';

const NEXT_STEPS = [
  'Application Received',
  'Talent Acquisition Review',
  'Interview',
  'Document Verification',
  'Offer',
  'Joining',
];

export default function ApplicationSuccessPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state?.candidateId) return <Navigate to="/candidate" replace />;

  return (
    <div className="cand csection" style={{ maxWidth: 720 }}>
      <div className="success-screen">
        <div className="success-screen__check">
          <Icon name="CheckCircle2" size={32} />
        </div>
        <h1 className="page-title">Application Submitted Successfully</h1>
        <p className="text-secondary mt-2">
          Thank you for applying to TalentFlow{state.jobTitle ? ` for ${state.jobTitle}` : ''}. Our team will review your
          application and get back to you.
        </p>

        <div className="stack gap-3 mt-6" style={{ textAlign: 'left' }}>
          <div className="id-badge">
            <span className="id-badge__label">Candidate ID</span>
            <span className="id-badge__value">{state.candidateId}</span>
          </div>
          <div className="id-badge">
            <span className="id-badge__label">Application ID</span>
            <span className="id-badge__value">{state.applicationId}</span>
          </div>
          <div className="id-badge">
            <span className="id-badge__label">Status</span>
            <span><span className="badge badge--info"><Icon name="ClipboardList" size={12} /> Application Received</span></span>
          </div>
        </div>

        <div className="mt-6" style={{ textAlign: 'left' }}>
          <div className="strong mb-3">What happens next?</div>
          <div className="timeline">
            {NEXT_STEPS.map((label, i) => (
              <div className="timeline__item" key={label}>
                <div className={`timeline__dot${i === 0 ? ' timeline__dot--done' : ' timeline__dot--pending'}`}>
                  <Icon name={i === 0 ? 'Check' : 'Circle'} size={14} />
                </div>
                <div className="timeline__content">
                  <div className="timeline__title">{label}</div>
                  <div className="timeline__meta">{i === 0 ? 'Completed' : 'Upcoming'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="row center gap-3 mt-6">
          <Button icon="ClipboardList" onClick={() => navigate('/candidate/application')}>
            Track Application
          </Button>
          <Button variant="secondary" icon="Briefcase" onClick={() => navigate('/candidate')}>
            Back to Careers
          </Button>
        </div>
      </div>
    </div>
  );
}
