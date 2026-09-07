import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon.jsx';
import Button from '../../components/ta/Button.jsx';
import Card from '../../components/ta/Card.jsx';
import Tag from '../../components/ta/Tag.jsx';
import EmptyState from '../../components/ta/EmptyState.jsx';
import { ConfirmDialog } from '../../components/common/Modal.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { initialsOf, formatDate, formatCurrencyINR } from '../../utils/format.js';
import {
  APP_STATUS,
  PIPELINE_STAGES,
  statusMeta,
  stageIndexForStatus,
  stageBadgeForStatus,
  ROUND_STATUS,
  ROUND_STATUS_META,
  DOC_STATUS,
  DOC_STATUS_META,
  DOC_CATEGORIES,
  OFFER_STATUS,
  OFFER_STATUS_META,
} from '../../constants/statuses.js';

const DOC_STAGES = [
  APP_STATUS.DOC_VERIFICATION, APP_STATUS.DOCS_VERIFIED, APP_STATUS.OFFER_DRAFT, APP_STATUS.OFFER_PENDING_HR,
  APP_STATUS.OFFER_ISSUED, APP_STATUS.OFFER_ACCEPTED, APP_STATUS.JOINING_PENDING, APP_STATUS.EMPLOYEE,
];
const toneMap = { info: 'blue', success: 'green', error: 'red', warning: 'amber', neutral: 'grey' };

/* Short pipeline steps for the header strip. */
const STEPS = ['Applied', 'Screening', 'Interview', 'Documents', 'Offer', 'Joining'];

/* One friendly line telling the candidate what happens next. */
function nextStep(status, pendingDocs) {
  switch (status) {
    case APP_STATUS.SUBMITTED:
    case APP_STATUS.TA_REVIEW:
      return { icon: 'Eye', text: 'Your application is being reviewed by our talent acquisition team.' };
    case APP_STATUS.INTERVIEW_PLANNING:
      return { icon: 'CalendarDays', text: "Interview scheduling is in progress — you'll be notified with the details." };
    case APP_STATUS.INTERVIEW_IN_PROGRESS:
      return { icon: 'CalendarClock', text: 'You have interview rounds scheduled. See the Interviews section below.' };
    case APP_STATUS.INTERVIEW_PASSED:
      return { icon: 'CheckCircle2', text: "You've cleared the interviews. Document verification is next." };
    case APP_STATUS.DOC_VERIFICATION:
      return { icon: 'Upload', text: pendingDocs > 0 ? `Please upload your remaining ${pendingDocs} document${pendingDocs > 1 ? 's' : ''} below.` : 'Your documents are under verification.' };
    case APP_STATUS.DOCS_VERIFIED:
    case APP_STATUS.OFFER_DRAFT:
    case APP_STATUS.OFFER_PENDING_HR:
      return { icon: 'FileCheck', text: 'All documents verified. Your offer is being prepared.' };
    case APP_STATUS.OFFER_ISSUED:
      return { icon: 'FileCheck', text: 'You have an offer! Review and respond in the offer section below.' };
    case APP_STATUS.OFFER_ACCEPTED:
    case APP_STATUS.JOINING_PENDING:
      return { icon: 'Rocket', text: 'Offer accepted. HR will reach out with your joining formalities.' };
    case APP_STATUS.EMPLOYEE:
      return { icon: 'UserRoundCheck', text: 'Welcome aboard! Your employee record is now active.' };
    default:
      return null;
  }
}

/* Small inline upload button — keeps only file metadata, like the rest of the app. */
function DocUpload({ label, onFile }) {
  const ref = useRef(null);
  return (
    <>
      <button className="ta-btn ta-btn--ghost" onClick={() => ref.current?.click()}>
        <Icon name="Upload" size={14} /> Upload
      </button>
      <input
        ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png" hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile({ name: f.name, size: f.size, type: f.type, uploadedAt: new Date().toISOString() });
        }}
        aria-label={`Upload ${label}`}
      />
    </>
  );
}

export default function MyApplicationPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const {
    data, getApplication, interviewsFor, documentsFor, offerFor, employeeFor, activitiesFor,
    resubmitApplication, uploadDocument, acceptOffer, declineOffer,
  } = useApp();
  const [declineOpen, setDeclineOpen] = useState(false);

  const app = data.myApplicationId ? getApplication(data.myApplicationId) : null;

  if (!app) {
    return (
      <div className="cx-page">
        <EmptyState
          icon="FileText"
          title="No application yet"
          message="Once you submit an application it will appear here with a live status timeline."
          action={<Button icon="Briefcase" onClick={() => navigate('/candidate/jobs')}>Browse jobs</Button>}
        />
      </div>
    );
  }

  const interviews = interviewsFor(app.id);
  const documents = documentsFor(app.id);
  const offer = offerFor(app.id);
  const employee = employeeFor(app.id);
  const activities = activitiesFor(app.id);
  const name = `${app.personal.firstName} ${app.personal.lastName}`;
  const badge = stageBadgeForStatus(app.status);

  const stageIdx = stageIndexForStatus(app.status);
  const rejected = app.status === APP_STATUS.REJECTED;
  const progress = rejected ? 0 : Math.round(((Math.max(0, stageIdx) + 1) / PIPELINE_STAGES.length) * 100);

  const stages = PIPELINE_STAGES.map((s, i) => ({
    label: s.label,
    state: rejected ? (i === 0 ? 'done' : 'pending') : i < stageIdx ? 'done' : i === stageIdx ? 'current' : 'pending',
  }));

  const showDocuments = DOC_STAGES.includes(app.status);
  const verifiedCount = documents.filter((d) => d.status === DOC_STATUS.VERIFIED).length;
  const pendingDocs = documents.filter((d) => [DOC_STATUS.PENDING, DOC_STATUS.REJECTED].includes(d.status)).length;
  const hint = nextStep(app.status, pendingDocs);

  const steps = STEPS.map((label, i) => ({
    label,
    state: rejected ? (i === 0 ? 'done' : 'pending') : i < stageIdx ? 'done' : i === stageIdx ? 'active' : 'pending',
  }));

  return (
    <div className="cx-page">
      <div className={`cx-idcard${employee ? ' cx-idcard--done' : ''}`}>
        <div className="cx-idcard__id">
          <span className="cx-idcard__avatar">{initialsOf(name)}</span>
          <div>
            <h2>{employee ? `Welcome aboard, ${app.personal.firstName}` : `Hi ${app.personal.firstName}`}</h2>
            <div className="cx-idcard__meta">
              {employee ? `Employee ID · ${employee.id}` : `Candidate ID · ${app.candidateId}`} · {app.jobTitle}
            </div>
          </div>
        </div>
        <div className="cx-idcard__progress">
          <div className="cx-idcard__progresshead">
            <span>{rejected ? 'Application status' : 'Progress'}</span>
            <span>{rejected ? 'Closed' : `${progress}%`}</span>
          </div>
          <div className="cx-idcard__bar"><div style={{ width: `${rejected ? 100 : progress}%` }} /></div>
          <div className="cx-idcard__tag"><Tag tone={badge.tone}>{badge.label}</Tag></div>
        </div>
      </div>

      <div className="ta-cell-sub" style={{ marginBottom: 14 }}>
        {app.id} · Submitted {formatDate(app.submittedAt)} · Assigned to {app.assignedTo}
      </div>

      {!rejected && (
        <div className="cx-steps-card">
          <ol className="cx-steps">
            {steps.map((s, i) => (
              <li key={s.label} className={`cx-step${s.state === 'done' ? ' cx-step--done' : s.state === 'active' ? ' cx-step--active' : ''}`}>
                <span className="cx-step__dot">{s.state === 'done' ? <Icon name="Check" size={12} /> : i + 1}</span>
                <span>{s.label}</span>
                {i < steps.length - 1 && <span className="cx-step__line" />}
              </li>
            ))}
          </ol>
        </div>
      )}

      {hint && app.status !== APP_STATUS.RETURNED && (
        <div className="cx-next">
          <span className="cx-next__icon"><Icon name={hint.icon} size={15} /></span>
          <span className="cx-next__label">What's next</span>
          <span className="cx-next__text">{hint.text}</span>
        </div>
      )}

      {app.status === APP_STATUS.RETURNED && (
        <div className="ta-note ta-note--warn" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="RotateCcw" size={15} /> <strong>Action needed:</strong> {app.returnReason}
          </div>
          <Button icon="RotateCcw" onClick={() => { resubmitApplication(app.id); toast.success('Application resubmitted for review.'); }}>
            Update &amp; resubmit
          </Button>
        </div>
      )}
      {rejected && (
        <div className="ta-note ta-note--err">
          <Icon name="XCircle" size={15} />
          {app.rejectReason || 'Thank you for your interest. We encourage you to apply for other roles in the future.'}
        </div>
      )}

      <div className="ta-stack">
          <Card title="Recruitment progress">
            <ol className="cx-proglist">
              {stages.map((s) => (
                <li key={s.label}>
                  <span className="cx-proglist__dot" style={{
                    background: s.state === 'pending' ? 'var(--ta-line)' : s.state === 'current' ? 'var(--ta-blue)' : 'var(--tag-green-fg)',
                  }} />
                  <div>
                    <div className="ta-cell-strong" style={{ color: s.state === 'pending' ? 'var(--ta-text-mute)' : undefined }}>{s.label}</div>
                    <div className="ta-cell-sub">
                      {s.state === 'done' ? 'Completed' : s.state === 'current' ? statusMeta(app.status).label : 'Not started'}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          {interviews.some((iv) => iv.status === ROUND_STATUS.SCHEDULED) && (
            <Card title="Interviews">
              <div className="ta-stack">
                {interviews.map((iv) => {
                  const m = ROUND_STATUS_META[iv.status];
                  return (
                    <div className="ta-round" key={iv.id}>
                      <div className="ta-round__head">
                        <span className="ta-cell-strong">Round {iv.round} · {iv.type}</span>
                        <Tag tone={toneMap[m.tone] || 'grey'}>{m.label}</Tag>
                      </div>
                      <div className="ta-cell-sub">{formatDate(iv.date)} at {iv.time} · {iv.mode}{iv.interviewer ? ` · ${iv.interviewer}` : ''}</div>
                      {iv.mode === 'Online' && iv.link && iv.status === ROUND_STATUS.SCHEDULED && (
                        <a href={iv.link} target="_blank" rel="noreferrer" className="ta-link" style={{ marginTop: 4 }}>Join meeting link</a>
                      )}
                      {iv.comments && iv.status !== ROUND_STATUS.SCHEDULED && (
                        <div className="ta-cell-sub" style={{ marginTop: 4 }}>Feedback: {iv.comments}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {showDocuments && (
            <Card
              title="Required documents"
              action={<Tag tone={verifiedCount === documents.length ? 'green' : 'amber'}>{verifiedCount} of {documents.length} verified</Tag>}
            >
              <p className="ta-cell-sub" style={{ marginBottom: 14 }}>
                Upload each document below. Our team verifies them manually — the status updates here.
              </p>
              {DOC_CATEGORIES.filter((cat) => documents.some((d) => d.category === cat)).map((cat) => (
                <div key={cat} style={{ marginBottom: 14 }}>
                  <div className="ta-info__label" style={{ marginBottom: 6 }}>{cat}</div>
                  <div className="ta-stack" style={{ gap: 8 }}>
                    {documents.filter((d) => d.category === cat).map((doc) => {
                      const m = DOC_STATUS_META[doc.status];
                      return (
                        <div className="ta-docrow" key={doc.id}>
                          <span className="ta-docrow__icon"><Icon name="FileText" size={15} /></span>
                          <div className="grow" style={{ minWidth: 0 }}>
                            <div className="ta-cell-strong">{doc.label}</div>
                            <div className="ta-cell-sub">{doc.fileName || 'No file uploaded'}</div>
                            {doc.status === DOC_STATUS.REJECTED && doc.rejectionReason && (
                              <div className="ta-cell-sub" style={{ color: 'var(--tag-red-fg)' }}>Rejected: {doc.rejectionReason}</div>
                            )}
                          </div>
                          <Tag tone={toneMap[m.tone] || 'grey'}>{m.label}</Tag>
                          {[DOC_STATUS.PENDING, DOC_STATUS.REJECTED].includes(doc.status) && (
                            <DocUpload label={doc.label} onFile={(f) => { uploadDocument(doc.id, f); toast.success(`${doc.label} uploaded — now under verification.`); }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </Card>
          )}

          {offer && [OFFER_STATUS.ISSUED, OFFER_STATUS.ACCEPTED, OFFER_STATUS.DECLINED].includes(offer.status) && (
            <Card
              title="Your offer"
              action={<Tag tone={toneMap[OFFER_STATUS_META[offer.status].tone] || 'grey'}>{OFFER_STATUS_META[offer.status].label}</Tag>}
            >
              <p className="ta-cell-mute" style={{ lineHeight: 1.7, marginBottom: 14 }}>
                Dear {offer.candidateName}, we are pleased to offer you the position of <strong>{offer.jobTitle}</strong> in
                the {offer.department} team at Ccentrik, based in {offer.location}.
              </p>
              <div className="ta-info" style={{ marginBottom: 14 }}>
                <div className="ta-info__item"><span className="ta-info__label">Joining date</span><span className="ta-info__value">{formatDate(offer.joiningDate)}</span></div>
                <div className="ta-info__item"><span className="ta-info__label">Employment type</span><span className="ta-info__value">{offer.employmentType}</span></div>
                <div className="ta-info__item"><span className="ta-info__label">Annual compensation</span><span className="ta-info__value">{formatCurrencyINR(offer.compensation)}</span></div>
                <div className="ta-info__item"><span className="ta-info__label">Reporting manager</span><span className="ta-info__value">{offer.reportingManager}</span></div>
                <div className="ta-info__item"><span className="ta-info__label">Probation period</span><span className="ta-info__value">{offer.probationPeriod}</span></div>
                <div className="ta-info__item"><span className="ta-info__label">Benefits</span><span className="ta-info__value">{offer.benefits}</span></div>
              </div>
              {offer.status === OFFER_STATUS.ISSUED && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Button icon="CheckCircle2" onClick={() => { acceptOffer(offer.id); toast.success('Offer accepted. Welcome aboard!'); }}>Accept offer</Button>
                  <Button variant="ghost" icon="XCircle" onClick={() => setDeclineOpen(true)}>Reject offer</Button>
                  <Button variant="ghost" icon="Download" onClick={() => toast.info('Offer letter download is simulated in this prototype.')}>Download</Button>
                </div>
              )}
              {offer.status === OFFER_STATUS.ACCEPTED && (
                <div className="ta-note ta-note--ok"><Icon name="CheckCircle2" size={15} /> You accepted this offer. HR will reach out with joining formalities.</div>
              )}
            </Card>
          )}

          {employee && (
            <Card title="Employee record">
              <div className="ta-note ta-note--ok" style={{ margin: 0 }}>
                <Icon name="UserRoundCheck" size={15} />
                <span>Employee ID <strong>{employee.id}</strong> · {employee.position} · joined {formatDate(employee.joiningDate)}</span>
              </div>
            </Card>
          )}
        <Card title="Activity">
          {activities.length === 0 ? (
            <p className="ta-cell-mute">No activity yet.</p>
          ) : (
            <ol className="cx-activity">
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

      <ConfirmDialog
        open={declineOpen}
        onClose={() => setDeclineOpen(false)}
        title="Reject this offer?"
        message="This cannot be undone. The hiring team will be notified that you have declined the offer."
        confirmLabel="Yes, reject offer"
        tone="danger"
        onConfirm={() => { declineOffer(offer.id); setDeclineOpen(false); toast.success('Offer declined.'); }}
      />
    </div>
  );
}
