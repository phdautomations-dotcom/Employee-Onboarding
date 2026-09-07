import { useParams, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button.jsx';
import { EmptyState } from '../../components/common/States.jsx';
import CandidateProfile from '../../components/workflow/CandidateProfile.jsx';
import { useApp } from '../../context/AppContext.jsx';

export default function HRCandidateDetailPage() {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const { getApplicationByCandidate } = useApp();
  const app = getApplicationByCandidate(candidateId);

  if (!app) {
    return (
      <div className="page-body">
        <EmptyState icon="UserX" title="Candidate not found" action={<Button onClick={() => navigate('/hr/candidates')}>Back to candidates</Button>} />
      </div>
    );
  }

  return (
    <>
      <div className="page-body" style={{ paddingBottom: 0 }}>
        <Button variant="ghost" icon="ArrowLeft" onClick={() => navigate('/hr/candidates')}>
          Candidates
        </Button>
      </div>
      <CandidateProfile application={app} role="hr" />
    </>
  );
}
