import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon.jsx';
import TAHeader from '../../components/ta/TAHeader.jsx';
import Card from '../../components/ta/Card.jsx';
import Button from '../../components/ta/Button.jsx';
import Tag from '../../components/ta/Tag.jsx';
import EmptyState from '../../components/ta/EmptyState.jsx';
import Avatar from '../../components/ta/Avatar.jsx';
import ReasonModal from '../../components/workflow/ReasonModal.jsx';
import ScheduleInterviewModal from '../../components/workflow/ScheduleInterviewModal.jsx';
import InterviewResultModal from '../../components/workflow/InterviewResultModal.jsx';
import OfferDrawer from '../../components/workflow/OfferDrawer.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { findJob } from '../../data/jobs.js';
import {
  APP_STATUS,
  ROUND_STATUS,
  ROUND_STATUS_META,
  DOC_STATUS,
  DOC_STATUS_META,
  OFFER_STATUS_META,
  PIPELINE_STAGES,
  stageIndexForStatus,
  stageBadgeForStatus,
  isDocMandatory,
} from '../../constants/statuses.js';
import { formatDate, formatCurrencyINR } from '../../utils/format.js';

function Info({ label, value }) {
  return (
    <div className="ta-info__item">
      <span className="ta-info__label">{label}</span>
      <span className="ta-info__value">{value || '—'}</span>
    </div>
  );
}

const IN_REVIEW = [APP_STATUS.SUBMITTED, APP_STATUS.TA_REVIEW];
const IN_INTERVIEW = [APP_STATUS.INTERVIEW_PLANNING, APP_STATUS.INTERVIEW_IN_PROGRESS, APP_STATUS.INTERVIEW_PASSED];
const CAN_OFFER = [APP_STATUS.DOCS_VERIFIED, APP_STATUS.OFFER_DRAFT];
const DOC_STAGES = [
  APP_STATUS.DOC_VERIFICATION, APP_STATUS.DOCS_VERIFIED, APP_STATUS.OFFER_DRAFT,
  APP_STATUS.OFFER_ISSUED, APP_STATUS.OFFER_ACCEPTED, APP_STATUS.ONBOARDING_PENDING,
  APP_STATUS.HR_VERIFICATION, APP_STATUS.HR_VERIFICATION_REJECTED, APP_STATUS.JOINING_PENDING, APP_STATUS.EMPLOYEE,
];

export default function TACandidateDetailPage() {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const {
    getApplicationByCandidate, interviewsFor, documentsFor, offerFor, employeeFor, activitiesFor,
    startReview, approveApplication, returnApplication, rejectApplication,
    scheduleInterview, recordInterviewResult, advanceToDocuments,
    verifyDocument, rejectDocument, saveOffer, confirmOfferAccepted,
  } = useApp();

  const app = getApplicationByCandidate(candidateId);
  const [modal, setModal] = useState(null); // 'return' | 'reject' | 'schedule' | 'offer'
  const [resultFor, setResultFor] = useState(null);
  const [rejectDoc, setRejectDoc] = useState(null);

  useEffect(() => {
    if (app && app.status === APP_STATUS.SUBMITTED) startReview(app.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app?.id]);

  if (!app) {
    return (
      <EmptyState icon="UserX" title="Candidate not found" message="This candidate may have been removed."
        action={<Button variant="ghost" onClick={() => navigate('/ta/candidates')}>Back to candidates</Button>} />
    );
  }

  const name = `${app.personal.firstName} ${app.personal.lastName}`;
  const p = app.personal;
  const pr = app.professional;
  const job = app.jobId ? findJob(app.jobId) : null;
  const interviews = interviewsFor(app.id);
  const documents = documentsFor(app.id);
  const offer = offerFor(app.id);
  const employee = employeeFor(app.id);
  const activities = activitiesFor(app.id);
  const badge = stageBadgeForStatus(app.status);

  const stageIdx = Math.max(0, stageIndexForStatus(app.status));
  const rejected = app.status === APP_STATUS.REJECTED;
  const progress = rejected ? 0 : Math.round(((stageIdx + 1) / PIPELINE_STAGES.length) * 100);

  const canVerifyDocs = [APP_STATUS.DOC_VERIFICATION, APP_STATUS.DOCS_VERIFIED].includes(app.status);
  const showDocs = DOC_STAGES.includes(app.status);

  const act = (fn, msg) => { fn(); toast.success(msg); };

  return (
    <>
      <TAHeader
        title={name}
        subtitle={`${pr.currentJobTitle || 'Candidate'}${pr.currentCompany ? ` @ ${pr.currentCompany}` : ''} · ${pr.totalExperience || '—'} yrs · ${p.currentLocation || '—'}`}
        backTo="/ta/candidates"
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
          {IN_REVIEW.includes(app.status) && (
            <>
              <Button icon="CheckCircle2" onClick={() => act(() => approveApplication(app.id), 'Application approved — moved to interview planning.')}>Approve</Button>
              <Button variant="ghost" icon="RotateCcw" onClick={() => setModal('return')}>Return</Button>
              <Button variant="ghost" icon="XCircle" onClick={() => setModal('reject')}>Reject</Button>
            </>
          )}
          {IN_INTERVIEW.includes(app.status) && (
            <Button icon="CalendarPlus" onClick={() => setModal('schedule')}>Schedule interview</Button>
          )}
          {app.status === APP_STATUS.INTERVIEW_PASSED && (
            <Button icon="ArrowRight" onClick={() => act(() => advanceToDocuments(app.id), 'Moved to document verification.')}>Proceed to documents</Button>
          )}
          {CAN_OFFER.includes(app.status) && (
            <Button icon="FileCheck" onClick={() => setModal('offer')}>{offer ? 'Edit offer' : 'Prepare offer'}</Button>
          )}
          {app.status === APP_STATUS.OFFER_ISSUED && offer && (
            <Button icon="CheckCircle2" onClick={() => act(() => confirmOfferAccepted(offer.id), 'Offer acceptance confirmed — handed over to HR.')}>
              Confirm offer accepted
            </Button>
          )}
          <a className="ta-btn ta-btn--ghost" href={`mailto:${p.email}`}><Icon name="Mail" size={15} /> Contact</a>
        </div>
      </div>

      {!rejected && (
        <div className="ta-progress-row">
          <div className="ta-progress"><div className="ta-progress__bar" style={{ width: `${progress}%` }} /></div>
          <span className="ta-cell-sub">{PIPELINE_STAGES[stageIdx]?.label} · {progress}%</span>
        </div>
      )}

      {app.status === APP_STATUS.RETURNED && (
        <div className="ta-note ta-note--warn"><Icon name="RotateCcw" size={15} /> Returned to candidate: {app.returnReason}</div>
      )}
      {app.status === APP_STATUS.OFFER_ISSUED && (
        <div className="ta-note ta-note--info">
          <Icon name="Mail" size={15} />
          <span>Offer letter sent. When the candidate replies by email to accept, click <strong>Confirm offer accepted</strong> to hand over to HR.</span>
        </div>
      )}
      {rejected && (
        <div className="ta-note ta-note--err"><Icon name="XCircle" size={15} /> Application rejected{app.rejectReason ? `: ${app.rejectReason}` : ''}</div>
      )}

      <div className="ta-detail-grid">
        <div className="ta-stack">
          <Card title="Overview">
            <div className="ta-info">
              <Info label="Full name" value={name} />
              <Info label="Applied for" value={app.jobTitle} />
              <Info label="Application type" value={app.isGeneral ? 'General application' : 'Specific vacancy'} />
              <Info label="Source" value={app.source} />
              <Info label="Submitted" value={formatDate(app.submittedAt)} />
              <Info label="Assigned to" value={app.assignedTo} />
            </div>
          </Card>

          <Card title="Professional experience">
            <div className="ta-info">
              <Info label="Current title" value={pr.currentJobTitle} />
              <Info label="Current company" value={pr.currentCompany} />
              <Info label="Total experience" value={pr.totalExperience ? `${pr.totalExperience} years` : '—'} />
              <Info label="Relevant experience" value={pr.relevantExperience ? `${pr.relevantExperience} years` : '—'} />
              <Info label="Notice period" value={pr.noticePeriod} />
              <Info label="Expected CTC" value={formatCurrencyINR(pr.expectedCTC)} />
            </div>
          </Card>

          <Card title="Skills & education">
            <div className="ta-skills" style={{ marginBottom: 16 }}>
              {(pr.skills || []).length ? pr.skills.map((s) => <span key={s} className="ta-skill">{s}</span>) : <span className="ta-cell-mute">No skills listed</span>}
            </div>
            {(app.education || []).map((e, i) => (
              <div key={e.id || i} className="ta-info__item" style={{ marginBottom: 8 }}>
                <span className="ta-info__label">{e.qualification || `Education ${i + 1}`}</span>
                <span className="ta-info__value">{[e.university, e.specialization, e.year].filter(Boolean).join(' · ') || '—'}</span>
              </div>
            ))}
          </Card>

          {interviews.length > 0 && (
            <Card title="Interviews">
              <div className="ta-stack">
                {interviews.map((iv) => {
                  const m = ROUND_STATUS_META[iv.status];
                  return (
                    <div className="ta-round" key={iv.id}>
                      <div className="ta-round__head">
                        <span className="ta-cell-strong">Round {iv.round} · {iv.type}</span>
                        <Tag tone={m.tone === 'info' ? 'blue' : m.tone === 'success' ? 'green' : m.tone === 'error' ? 'red' : m.tone === 'warning' ? 'amber' : 'grey'}>{m.label}</Tag>
                      </div>
                      <div className="ta-cell-sub">{formatDate(iv.date)} at {iv.time} · {iv.mode} · {iv.interviewer}</div>
                      {iv.comments && iv.status !== ROUND_STATUS.SCHEDULED && <div className="ta-cell-sub" style={{ marginTop: 4 }}>Feedback: {iv.comments}</div>}
                      {iv.status === ROUND_STATUS.SCHEDULED && (
                        <div style={{ marginTop: 8 }}>
                          <Button variant="ghost" icon="ClipboardCheck" onClick={() => setResultFor(iv)}>Record result</Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {showDocs && (
            <Card title="Documents" action={<Tag tone={documents.every((d) => d.status === DOC_STATUS.VERIFIED) ? 'green' : 'amber'}>
              {documents.filter((d) => d.status === DOC_STATUS.VERIFIED).length}/{documents.length} verified
            </Tag>}>
              <div className="ta-stack">
                {documents.map((doc) => {
                  const m = DOC_STATUS_META[doc.status];
                  const tone = { info: 'blue', success: 'green', error: 'red', warning: 'amber', neutral: 'grey' }[m.tone] || 'grey';
                  const mandatory = isDocMandatory(doc.key);
                  return (
                    <div className="ta-docrow" key={doc.id}>
                      <span className="ta-docrow__icon"><Icon name="FileText" size={16} /></span>
                      <div className="grow">
                        <div className="ta-cell-strong">{doc.label}{mandatory && <span className="cx-req" title="Mandatory"> *</span>}</div>
                        <div className="ta-cell-sub">{doc.fileName || (doc.status === DOC_STATUS.WAIVED ? 'Not provided by candidate' : 'No file uploaded')}{doc.status === DOC_STATUS.REJECTED && doc.rejectionReason ? ` · ${doc.rejectionReason}` : ''}</div>
                        {doc.status === DOC_STATUS.WAIVED && doc.skipReason && (
                          <div className="ta-cell-sub" style={{ color: 'var(--tag-amber-fg)' }}>Candidate's reason: {doc.skipReason}</div>
                        )}
                      </div>
                      <Tag tone={tone}>{m.label}</Tag>
                      {canVerifyDocs && [DOC_STATUS.UPLOADED, DOC_STATUS.VERIFIED].includes(doc.status) && (
                        <span className="ta-rowactions" style={{ opacity: 1 }}>
                          {doc.status !== DOC_STATUS.VERIFIED && (
                            <button className="ta-iconbtn" title="Verify" onClick={() => act(() => verifyDocument(doc.id), `${doc.label} verified.`)}><Icon name="Check" size={15} /></button>
                          )}
                          <button className="ta-iconbtn" title="Reject" onClick={() => setRejectDoc(doc)}><Icon name="X" size={15} /></button>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {offer && (
            <Card title="Offer" action={<Tag tone={{ neutral: 'grey', warning: 'amber', info: 'blue', success: 'green', error: 'red' }[OFFER_STATUS_META[offer.status].tone] || 'grey'}>{OFFER_STATUS_META[offer.status].label}</Tag>}>
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

      {/* Modals — reused from the existing workflow */}
      <ReasonModal
        open={modal === 'return'} onClose={() => setModal(null)}
        title="Return application" label="Reason" confirmLabel="Return application" tone="secondary"
        onSubmit={(reason) => { returnApplication(app.id, reason); setModal(null); toast.success('Application returned to candidate.'); }}
      />
      <ReasonModal
        open={modal === 'reject'} onClose={() => setModal(null)}
        title="Reject application" label="Reason" confirmLabel="Reject candidate" tone="danger"
        onSubmit={(reason) => { rejectApplication(app.id, reason); setModal(null); toast.success('Application rejected.'); }}
      />
      <ReasonModal
        open={!!rejectDoc} onClose={() => setRejectDoc(null)}
        title={`Reject ${rejectDoc?.label || 'document'}`} label="What is wrong with it?" confirmLabel="Reject document" tone="danger"
        onSubmit={(reason) => { rejectDocument(rejectDoc.id, reason); setRejectDoc(null); toast.success('Document rejected — candidate notified.'); }}
      />
      <ScheduleInterviewModal
        open={modal === 'schedule'} onClose={() => setModal(null)} roundNumber={interviews.length + 1}
        onSchedule={(payload) => { scheduleInterview(app.id, payload); setModal(null); toast.success('Interview scheduled.'); }}
      />
      <InterviewResultModal
        open={!!resultFor} onClose={() => setResultFor(null)} interview={resultFor}
        onSave={(res) => { recordInterviewResult(resultFor.id, res); setResultFor(null); toast.success('Interview result saved.'); }}
      />
      {modal === 'offer' && (
        <OfferDrawer
          open onClose={() => setModal(null)} application={app} job={job} existingOffer={offer}
          onSave={(payload, submitForApproval) => {
            saveOffer(app.id, payload, submitForApproval);
            setModal(null);
            toast.success(submitForApproval ? 'Offer submitted for HR approval.' : 'Offer draft saved.');
          }}
        />
      )}
    </>
  );
}
