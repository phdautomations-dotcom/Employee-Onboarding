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
/* The candidate's own journey — the TA-only "screening" phase is left out. */
const CANDIDATE_STEPS = ['Applied', 'Interview', 'Documents', 'Offer', 'Joining'];
/* PIPELINE_STAGES index (0 application, 1 ta_review, 2 interview … 5 onboarding)
   mapped to a CANDIDATE_STEPS index. */
const PIPELINE_TO_CANDIDATE = [0, 0, 1, 2, 3, 4];

/* Which on-page card an activity entry belongs to. */
const SECTION_BY_TYPE = {
  interview: 'sec-interviews',
  documents: 'sec-documents',
  offer: 'sec-offer',
  onboarding: 'sec-employee',
};

/* Jump to whatever an activity entry is about — the exact document row when we
   can identify it, otherwise the section card — and flash it. */
function jumpToActivity(a, documents) {
  let id = SECTION_BY_TYPE[a.type] || 'sec-progress';
  if (a.type === 'documents') {
    const m = /^(.+?)\s+(rejected|verified|uploaded)/i.exec(a.description || '');
    const doc = m && documents.find((d) => d.label === m[1]);
    if (doc) id = `doc-${doc.id}`;
  }
  const el = document.getElementById(id) || document.getElementById('sec-progress');
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('cx-flash');
  setTimeout(() => el.classList.remove('cx-flash'), 1400);
}

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

  /* Where the candidate is in their own journey, and how many steps to show
     (future steps stay hidden until the application reaches them). */
  const candIdx = PIPELINE_TO_CANDIDATE[Math.max(0, stageIdx)] ?? 0;
  const shownCount = rejected ? CANDIDATE_STEPS.length : candIdx + 1;
  const progress = rejected ? 0 : Math.round(((candIdx + 1) / CANDIDATE_STEPS.length) * 100);

  const showDocuments = DOC_STAGES.includes(app.status);
  const verifiedCount = documents.filter((d) => d.status === DOC_STATUS.VERIFIED).length;
  const pendingDocs = documents.filter((d) => [DOC_STATUS.PENDING, DOC_STATUS.REJECTED].includes(d.status)).length;
  const hint = nextStep(app.status, pendingDocs);

  const steps = CANDIDATE_STEPS.slice(0, shownCount).map((label, i) => ({
    label,
    state: rejected ? (i === 0 ? 'done' : 'pending') : i < candIdx ? 'done' : 'active',
  }));

  return (
    <div className="cx-page">
      <div className={`cx-idcard${employee ? ' cx-idcard--done' : ''}`}>
        <div className="cx-idcard__id">
          <span className="cx-idcard__avatar">{initialsOf(name)}</span>
          <div>
            <h2>{employee ? `Welcome aboard, ${app.personal.firstName}` : `Hi ${app.personal.firstName}`}</h2>
            <div className="cx-idcard__meta">{app.jobTitle}</div>
          </div>
        </div>
        <dl className="cx-idcard__facts">
          <div>
            <dt>{employee ? 'Employee ID' : 'Candidate ID'}</dt>
            <dd>{employee ? employee.id : app.candidateId}</dd>
          </div>
          <div><dt>Application ID</dt><dd>{app.id}</dd></div>
          <div><dt>Submitted</dt><dd>{formatDate(app.submittedAt)}</dd></div>
          <div><dt>Assigned to</dt><dd>{app.assignedTo}</dd></div>
        </dl>
        <div className="cx-idcard__progress">
          <div className="cx-idcard__donut" role="img" aria-label={`Progress ${progress} percent`}>
            <svg viewBox="0 0 42 42">
              <circle className="cx-donut-track" cx="21" cy="21" r="15.9" pathLength="100" />
              <circle
                className="cx-donut-arc" cx="21" cy="21" r="15.9" pathLength="100"
                strokeDasharray={`${rejected ? 100 : progress} 100`}
              />
              <defs>
                <linearGradient id="cxDonut" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#5eead4" />
                  <stop offset="50%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
            </svg>
            <span className="cx-idcard__donutnum">{rejected ? '—' : `${progress}%`}</span>
          </div>
          <div className="cx-idcard__pmeta">
            <span className="cx-idcard__plabel">{rejected ? 'Application status' : 'Progress'}</span>
            <div className="cx-idcard__tag"><Tag tone={badge.tone}>{badge.label}</Tag></div>
          </div>
        </div>
      </div>

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

      <div className="ta-detail-grid">
        <div className="ta-stack">
          <Card id="sec-progress" title="Recruitment progress">
            {!rejected && (
              <div className="cx-steps-scroll">
                <ol className="cx-steps">
                  {steps.map((s, i) => (
                    <li key={s.label} className={`cx-step${s.state === 'done' ? ' cx-step--done' : ' cx-step--active'}`}>
                      <span className="cx-step__dot">{s.state === 'done' ? <Icon name="Check" size={12} /> : i + 1}</span>
                      <span>{s.label}</span>
                      {i < steps.length - 1 && <span className="cx-step__line" />}
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {hint && app.status !== APP_STATUS.RETURNED && (
              <div className="cx-nextline">
                <Icon name={hint.icon} size={15} />
                <span><strong>What's next:</strong> {hint.text}</span>
              </div>
            )}
          </Card>

          {interviews.some((iv) => iv.status === ROUND_STATUS.SCHEDULED) && (
            <Card id="sec-interviews" title="Interviews">
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
              id="sec-documents"
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
                        <div className="ta-docrow" key={doc.id} id={`doc-${doc.id}`}>
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
              id="sec-offer"
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
            <Card id="sec-employee" title="Employee record">
              <div className="ta-note ta-note--ok" style={{ margin: 0 }}>
                <Icon name="UserRoundCheck" size={15} />
                <span>Employee ID <strong>{employee.id}</strong> · {employee.position} · joined {formatDate(employee.joiningDate)}</span>
              </div>
            </Card>
          )}
        </div>

        <div className="ta-stack">
          <Card title="Activity">
            {activities.length === 0 ? (
              <p className="ta-cell-mute">No activity yet.</p>
            ) : (
              <ol className="ta-timeline">
                {activities.slice(0, 12).map((a) => (
                  <li key={a.id}>
                    <span className="ta-timeline__dot" />
                    <button type="button" className="cx-actitem" onClick={() => jumpToActivity(a, documents)}>
                      <div className="ta-cell-strong">{a.title}</div>
                      <div className="ta-cell-sub">{a.description}</div>
                      <div className="ta-cell-sub">{formatDate(a.at)} · {a.actor}</div>
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
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
