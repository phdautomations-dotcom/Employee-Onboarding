import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon.jsx';
import TAHeader from '../../components/ta/TAHeader.jsx';
import Card from '../../components/ta/Card.jsx';
import Button from '../../components/ta/Button.jsx';
import Tag from '../../components/ta/Tag.jsx';
import EmptyState from '../../components/ta/EmptyState.jsx';
import Avatar from '../../components/ta/Avatar.jsx';
import ReasonModal from '../../components/workflow/ReasonModal.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import {
  APP_STATUS,
  DOC_STATUS,
  DOC_STATUS_META,
  OFFER_STATUS_META,
  PIPELINE_STAGES,
  stageIndexForStatus,
  stageBadgeForStatus,
} from '../../constants/statuses.js';
import { formatDate, formatCurrencyINR } from '../../utils/format.js';

// The old system's tone names ('info'/'success'/...) don't match Tag's tone
// names ('blue'/'green'/...) — map them once, same as the TA detail page does.
const TONE = { info: 'blue', success: 'green', error: 'red', warning: 'amber', neutral: 'grey' };

function Info({ label, value }) {
  return (
    <div className="ta-info__item">
      <span className="ta-info__label">{label}</span>
      <span className="ta-info__value">{value || '—'}</span>
    </div>
  );
}

export default function HRCandidateDetailPage() {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const {
    getApplicationByCandidate, documentsFor, offerFor, employeeFor, activitiesFor,
    verifyDocument, rejectDocument, verifyOnboarding, rejectOnboarding, completeJoining,
  } = useApp();

  const app = getApplicationByCandidate(candidateId);
  const [rejectingOnboarding, setRejectingOnboarding] = useState(false);
  const [rejectDoc, setRejectDoc] = useState(null);

  if (!app) {
    return (
      <EmptyState icon="UserX" title="Candidate not found" message="This candidate may have been removed."
        action={<Button variant="ghost" onClick={() => navigate('/hr/candidates')}>Back to candidates</Button>} />
    );
  }

  const name = `${app.personal.firstName} ${app.personal.lastName}`;
  const p = app.personal;
  const pr = app.professional;
  const documents = documentsFor(app.id);
  const offer = offerFor(app.id);
  const employee = employeeFor(app.id);
  const activities = activitiesFor(app.id);
  const badge = stageBadgeForStatus(app.status);

  const stageIdx = Math.max(0, stageIndexForStatus(app.status));
  const progress = Math.round(((stageIdx + 1) / PIPELINE_STAGES.length) * 100);

  const act = (fn, msg) => { fn(); toast.success(msg); };
  const markJoined = () => {
    const employeeId = completeJoining(app.id);
    toast.success(`Joining completed — employee ID ${employeeId}.`);
  };

  return (
    <>
      <TAHeader
        title={name}
        subtitle={`${pr.currentJobTitle || 'Candidate'}${pr.currentCompany ? ` @ ${pr.currentCompany}` : ''} · ${pr.totalExperience || '—'} yrs · ${p.currentLocation || '—'}`}
        backTo="/hr/candidates"
        backLabel="Candidates"
      />

      <div className="ta-profile-head">
        <Avatar name={name} />
        <div className="grow">
          <div className="ta-profile-head__tags">
            <Tag tone={badge.tone}>{badge.label}</Tag>
            <span className="ta-cell-sub">{app.candidateId} · applied for {app.jobTitle}</span>
          </div>
        </div>
        <div className="ta-profile-head__actions">
          {app.status === APP_STATUS.HR_VERIFICATION && (
            <>
              <Button icon="CheckCircle2" onClick={() => act(() => verifyOnboarding(app.id), 'Onboarding verified — joining is now pending.')}>Verify onboarding</Button>
              <Button variant="ghost" icon="RotateCcw" onClick={() => setRejectingOnboarding(true)}>Return to candidate</Button>
            </>
          )}
          {app.status === APP_STATUS.JOINING_PENDING && (
            <Button icon="UserRoundCheck" onClick={markJoined}>Mark joining completed</Button>
          )}
          <a className="ta-btn ta-btn--ghost" href={`mailto:${p.email}`}><Icon name="Mail" size={15} /> Contact</a>
        </div>
      </div>

      <div className="ta-progress-row">
        <div className="ta-progress"><div className="ta-progress__bar" style={{ width: `${progress}%` }} /></div>
        <span className="ta-cell-sub">{PIPELINE_STAGES[stageIdx]?.label} · {progress}%</span>
      </div>

      {app.status === APP_STATUS.HR_VERIFICATION_REJECTED && app.onboardingRejectReason && (
        <div className="ta-note ta-note--warn"><Icon name="RotateCcw" size={15} /> Returned to candidate: {app.onboardingRejectReason}</div>
      )}

      <div className="ta-detail-grid">
        <div className="ta-stack">
          <Card title="Overview">
            <div className="ta-info">
              <Info label="Full name" value={name} />
              <Info label="Applied for" value={app.jobTitle} />
              <Info label="Source" value={app.source} />
              <Info label="Submitted" value={formatDate(app.submittedAt)} />
              <Info label="Total experience" value={pr.totalExperience ? `${pr.totalExperience} years` : '—'} />
              <Info label="Expected CTC" value={formatCurrencyINR(pr.expectedCTC)} />
            </div>
          </Card>

          {documents.length > 0 && (
            <Card title="Documents" action={
              <Tag tone={documents.every((d) => d.status === DOC_STATUS.VERIFIED) ? 'green' : 'amber'}>
                {documents.filter((d) => d.status === DOC_STATUS.VERIFIED).length}/{documents.length} verified
              </Tag>
            }>
              <div className="ta-stack">
                {documents.map((doc) => {
                  const m = DOC_STATUS_META[doc.status];
                  return (
                    <div className="ta-docrow" key={doc.id}>
                      <span className="ta-docrow__icon"><Icon name="FileText" size={16} /></span>
                      <div className="grow">
                        <div className="ta-cell-strong">{doc.label}</div>
                        <div className="ta-cell-sub">{doc.fileName || 'No file uploaded'}{doc.status === DOC_STATUS.REJECTED && doc.rejectionReason ? ` · ${doc.rejectionReason}` : ''}</div>
                      </div>
                      <Tag tone={TONE[m.tone] || 'grey'}>{m.label}</Tag>
                      {doc.status === DOC_STATUS.UPLOADED && (
                        <span className="ta-rowactions" style={{ opacity: 1 }}>
                          <button className="ta-iconbtn" title="Verify" onClick={() => act(() => verifyDocument(doc.id), `${doc.label} verified.`)}><Icon name="Check" size={15} /></button>
                          <button className="ta-iconbtn" title="Reject" onClick={() => setRejectDoc(doc)}><Icon name="X" size={15} /></button>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {app.onboarding && (
            <Card title="Onboarding Details">
              <div className="ta-info">
                <Info label="10th school" value={app.onboarding.tenth?.school} />
                <Info label="10th board / year" value={[app.onboarding.tenth?.board, app.onboarding.tenth?.year].filter(Boolean).join(' · ')} />
                <Info label="10th percentage" value={app.onboarding.tenth?.percentage ? `${app.onboarding.tenth.percentage}%` : ''} />
                <Info label="12th school" value={app.onboarding.twelfth?.school} />
                <Info label="12th board / year" value={[app.onboarding.twelfth?.board, app.onboarding.twelfth?.year].filter(Boolean).join(' · ')} />
                <Info label="12th percentage" value={app.onboarding.twelfth?.percentage ? `${app.onboarding.twelfth.percentage}%` : ''} />
                <Info label="Permanent address" value={[app.onboarding.address?.line1, app.onboarding.address?.city, app.onboarding.address?.state, app.onboarding.address?.postalCode].filter(Boolean).join(', ')} />
                <Info label="Emergency contact" value={app.onboarding.emergencyContact?.name && `${app.onboarding.emergencyContact.name} · ${app.onboarding.emergencyContact.phone}`} />
              </div>
            </Card>
          )}

          {offer && (
            <Card title="Offer" action={<Tag tone={TONE[OFFER_STATUS_META[offer.status].tone] || 'grey'}>{OFFER_STATUS_META[offer.status].label}</Tag>}>
              <div className="ta-info">
                <Info label="Job title" value={offer.jobTitle} />
                <Info label="Department" value={offer.department} />
                <Info label="Joining date" value={formatDate(offer.joiningDate)} />
                <Info label="Compensation" value={formatCurrencyINR(offer.compensation)} />
                <Info label="Reporting manager" value={offer.reportingManager} />
                <Info label="Probation" value={offer.probationPeriod} />
              </div>
            </Card>
          )}

          {employee && (
            <Card title="Employee record">
              <div className="ta-info">
                <Info label="Employee ID" value={employee.id} />
                <Info label="Position" value={employee.position} />
                <Info label="Department" value={employee.department} />
                <Info label="Joining date" value={formatDate(employee.joiningDate)} />
              </div>
            </Card>
          )}
        </div>

        <div className="ta-stack">
          <Card title="Contact">
            <div className="ta-info ta-info--1">
              <Info label="Email" value={p.email} />
              <Info label="Mobile" value={p.mobile} />
              <Info label="Current location" value={p.currentLocation} />
              <Info label="Preferred location" value={p.preferredLocation} />
            </div>
          </Card>

          <Card title="Activity">
            {activities.length === 0 ? (
              <p className="ta-cell-mute">No activity yet.</p>
            ) : (
              <ol className="ta-timeline">
                {activities.slice(0, 12).map((a) => (
                  <li key={a.id}>
                    <span className="ta-timeline__dot" />
                    <div>
                      <div className="ta-cell-strong">{a.title}</div>
                      <div className="ta-cell-sub">{a.description}</div>
                      <div className="ta-cell-sub">{formatDate(a.at)} · {a.actor}</div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      </div>

      <ReasonModal
        open={rejectingOnboarding} onClose={() => setRejectingOnboarding(false)}
        title="Return onboarding details" label="What needs to be corrected?" confirmLabel="Return to candidate" tone="secondary"
        onSubmit={(reason) => { rejectOnboarding(app.id, reason); setRejectingOnboarding(false); toast.success('Onboarding details returned to candidate.'); }}
      />
      <ReasonModal
        open={!!rejectDoc} onClose={() => setRejectDoc(null)}
        title={`Reject ${rejectDoc?.label || 'document'}`} label="What is wrong with it?" confirmLabel="Reject document" tone="danger"
        onSubmit={(reason) => { rejectDocument(rejectDoc.id, reason); setRejectDoc(null); toast.success('Document rejected — candidate notified.'); }}
      />
    </>
  );
}
