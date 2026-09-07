import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon.jsx';
import Button from '../../components/common/Button.jsx';
import { Card, InfoList } from '../../components/common/Card.jsx';
import { StatusBadge, Badge } from '../../components/common/Badge.jsx';
import { EmptyState } from '../../components/common/States.jsx';
import { ActivityTimeline } from '../../components/common/Timeline.jsx';
import RecruitmentTimeline from '../../components/workflow/RecruitmentTimeline.jsx';
import OnboardingJourney from '../../components/workflow/OnboardingJourney.jsx';
import { ConfirmDialog } from '../../components/common/Modal.jsx';
import FileUpload from '../../components/common/FileUpload.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import {
  APP_STATUS,
  PIPELINE_STAGES,
  statusMeta,
  stageIndexForStatus,
  ROUND_STATUS_META,
  DOC_STATUS,
  DOC_STATUS_META,
  DOC_CATEGORIES,
  OFFER_STATUS,
  OFFER_STATUS_META,
} from '../../constants/statuses.js';
import { formatDate, formatCurrencyINR } from '../../utils/format.js';

export default function MyApplicationPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const {
    data,
    getApplication,
    interviewsFor,
    documentsFor,
    offerFor,
    employeeFor,
    activitiesFor,
    resubmitApplication,
    uploadDocument,
    acceptOffer,
    declineOffer,
  } = useApp();

  const [declineOpen, setDeclineOpen] = useState(false);

  const app = data.myApplicationId ? getApplication(data.myApplicationId) : null;

  if (!app) {
    return (
      <div className="container" style={{ padding: '40px 24px' }}>
        <EmptyState
          icon="FileText"
          title="No application yet"
          message="Once you submit an application it will show up here with a live status timeline."
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

  const currentStageIdx = stageIndexForStatus(app.status);
  const rejected = app.status === APP_STATUS.REJECTED;
  const progressPct = rejected ? 0 : Math.round(((Math.max(0, currentStageIdx) + 1) / PIPELINE_STAGES.length) * 100);

  const stages = PIPELINE_STAGES.map((s, i) => ({
    key: s.key,
    label: s.label,
    state: rejected ? (i === 0 ? 'done' : 'pending') : i < currentStageIdx ? 'done' : i === currentStageIdx ? 'current' : 'pending',
    description:
      i === currentStageIdx && !rejected
        ? statusMeta(app.status).label
        : i < currentStageIdx
        ? 'Completed'
        : 'Not started',
  }));

  const showDocuments = [
    APP_STATUS.DOC_VERIFICATION,
    APP_STATUS.DOCS_VERIFIED,
    APP_STATUS.OFFER_DRAFT,
    APP_STATUS.OFFER_PENDING_HR,
    APP_STATUS.OFFER_ISSUED,
    APP_STATUS.OFFER_ACCEPTED,
    APP_STATUS.JOINING_PENDING,
    APP_STATUS.EMPLOYEE,
  ].includes(app.status);

  return (
    <div className="container" style={{ padding: '24px 24px 56px', maxWidth: 960 }}>
      <h1 className="page-title mb-3">My application</h1>

      <div className={`idcard${employee ? ' idcard--accent' : ''} mb-4`}>
        <div className="row between wrap gap-4">
          <div>
            <div className="idcard__avatar">{`${app.personal.firstName[0] || ''}${app.personal.lastName[0] || ''}`}</div>
            <h2>{employee ? `Welcome aboard, ${app.personal.firstName}` : `Hi ${app.personal.firstName}`}</h2>
            <div className="idcard__id">
              {employee ? `Employee ID · ${employee.id}` : `Candidate ID · ${app.candidateId}`} · {app.jobTitle}
            </div>
          </div>
          <div style={{ minWidth: 220 }}>
            <div className="row between text-xs" style={{ color: 'rgba(255,255,255,.8)' }}>
              <span>{rejected ? 'Application status' : 'Progress'}</span>
              <span>{rejected ? 'Closed' : `${progressPct}%`}</span>
            </div>
            <div className="idcard__progress">
              <div className="progress">
                <div className="progress__bar" style={{ width: `${rejected ? 100 : progressPct}%`, background: rejected ? 'rgba(255,255,255,.5)' : '#fff' }} />
              </div>
            </div>
            <div className="mt-2">
              <StatusBadge status={app.status} />
            </div>
          </div>
        </div>
      </div>

      <div className="text-small text-secondary mb-4">
        <span className="mono">{app.id}</span> · Submitted {formatDate(app.submittedAt)} · Assigned to {app.assignedTo}
      </div>

      {app.status === APP_STATUS.RETURNED && (
        <div className="alert alert--warning mb-4">
          <span className="alert__icon">
            <Icon name="RotateCcw" size={16} />
          </span>
          <div className="grow">
            <div className="strong">Application Returned</div>
            <div>Reason: {app.returnReason}</div>
            <Button
              className="mt-2"
              size="sm"
              icon="RotateCcw"
              onClick={() => {
                resubmitApplication(app.id);
                toast.success('Application updated and resubmitted for review.');
              }}
            >
              Update Application
            </Button>
          </div>
        </div>
      )}

      {rejected && (
        <div className="alert alert--error mb-4">
          <span className="alert__icon">
            <Icon name="XCircle" size={16} />
          </span>
          <div>
            <div className="strong">Application not taken forward</div>
            <div>{app.rejectReason || 'Thank you for your interest. We encourage you to apply for other roles in the future.'}</div>
          </div>
        </div>
      )}

      <div className="detail-grid">
        <div className="stack gap-5">
          <Card title="Recruitment timeline">
            <RecruitmentTimeline application={app} activities={activities} />
          </Card>

          {[APP_STATUS.OFFER_ACCEPTED, APP_STATUS.JOINING_PENDING, APP_STATUS.EMPLOYEE].includes(app.status) && (
            <Card title="Onboarding journey">
              <OnboardingJourney application={app} documents={documents} offer={offer} employee={employee} />
            </Card>
          )}

          {interviews.length > 0 && (
            <Card title="Interviews">
              <div className="stack gap-3">
                {interviews.map((iv) => {
                  const m = ROUND_STATUS_META[iv.status];
                  return (
                    <div className="round-card" key={iv.id}>
                      <div className="round-card__head">
                        <span className="strong">
                          Round {iv.round} · {iv.type}
                        </span>
                        <Badge tone={m.tone} icon={m.icon}>
                          {m.label}
                        </Badge>
                      </div>
                      <div className="job-card__meta">
                        <span><Icon name="CalendarDays" size={13} /> {formatDate(iv.date)} at {iv.time}</span>
                        <span><Icon name="Video" size={13} /> {iv.mode}</span>
                        {iv.interviewer && <span><Icon name="User" size={13} /> {iv.interviewer}</span>}
                      </div>
                      {iv.mode === 'Online' && iv.link && iv.status === 'SCHEDULED' && (
                        <a href={iv.link} target="_blank" rel="noreferrer" className="text-small">
                          Join meeting link
                        </a>
                      )}
                      {iv.location && <div className="text-small text-secondary">{iv.location}</div>}
                      {iv.comments && iv.status !== 'SCHEDULED' && (
                        <div className="text-small text-secondary">Feedback: {iv.comments}</div>
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
              actions={
                <Badge tone={documents.every((d) => d.status === DOC_STATUS.VERIFIED) ? 'success' : 'warning'}>
                  {documents.filter((d) => d.status === DOC_STATUS.VERIFIED).length} of {documents.length} verified
                </Badge>
              }
            >
              <p className="text-secondary text-small mb-4">
                Upload each document below. Our team verifies them manually — you'll see the status update here.
              </p>
              {DOC_CATEGORIES.filter((cat) => documents.some((d) => d.category === cat)).map((cat) => (
                <div className="doc-cat" key={cat}>
                  <div className="doc-cat__title">{cat}</div>
                  <div className="stack gap-2">
                    {documents.filter((d) => d.category === cat).map((doc) => {
                      const m = DOC_STATUS_META[doc.status];
                      return (
                        <div className="doc-card" key={doc.id}>
                          <span className="doc-card__icon">
                            <Icon name="FileText" size={18} />
                          </span>
                          <div className="grow">
                            <div className="strong text-small">{doc.label}</div>
                            <div className="text-xs text-secondary">{doc.fileName || 'No file uploaded'}</div>
                            {doc.status === DOC_STATUS.REJECTED && (
                              <div className="text-xs" style={{ color: 'var(--color-error)' }}>Rejected: {doc.rejectionReason}</div>
                            )}
                          </div>
                          <Badge tone={m.tone} icon={m.icon}>{m.label}</Badge>
                          {[DOC_STATUS.PENDING, DOC_STATUS.REJECTED].includes(doc.status) && (
                            <FileUpload
                              compact
                              accept=".pdf,.jpg,.jpeg,.png"
                              onFile={(f) => {
                                uploadDocument(doc.id, f);
                                toast.success(`${doc.label} uploaded — now under verification.`);
                              }}
                            />
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
              actions={
                <Badge tone={OFFER_STATUS_META[offer.status].tone} icon={OFFER_STATUS_META[offer.status].icon}>
                  {OFFER_STATUS_META[offer.status].label}
                </Badge>
              }
            >
              <div className="offer-letter mb-4">
                <h2>Offer of Employment</h2>
                <p>Dear {offer.candidateName},</p>
                <p>
                  We are pleased to offer you the position of <strong>{offer.jobTitle}</strong> in the {offer.department} team
                  at TalentFlow, based in {offer.location}.
                </p>
                <InfoList
                  items={[
                    { label: 'Joining Date', value: formatDate(offer.joiningDate) },
                    { label: 'Employment Type', value: offer.employmentType },
                    { label: 'Annual Compensation', value: formatCurrencyINR(offer.compensation) },
                    { label: 'Reporting Manager', value: offer.reportingManager },
                    { label: 'Probation Period', value: offer.probationPeriod },
                    { label: 'Benefits', value: offer.benefits },
                  ]}
                />
              </div>
              {offer.status === OFFER_STATUS.ISSUED && (
                <div className="row gap-3">
                  <Button
                    variant="success"
                    icon="CheckCircle2"
                    onClick={() => {
                      acceptOffer(offer.id);
                      toast.success('Offer accepted. Welcome aboard!');
                    }}
                  >
                    Accept Offer
                  </Button>
                  <Button variant="danger" icon="XCircle" onClick={() => setDeclineOpen(true)}>
                    Reject Offer
                  </Button>
                  <Button variant="secondary" icon="Download" onClick={() => toast.info('Offer letter download is simulated in this prototype.')}>
                    Download
                  </Button>
                </div>
              )}
              {offer.status === OFFER_STATUS.ACCEPTED && (
                <div className="alert alert--success">
                  <span className="alert__icon">
                    <Icon name="CheckCircle2" size={16} />
                  </span>
                  <div>You accepted this offer. HR will reach out with joining formalities.</div>
                </div>
              )}
            </Card>
          )}

          {employee && (
            <Card title="Employee record">
              <div className="alert alert--success">
                <span className="alert__icon">
                  <Icon name="UserRoundCheck" size={16} />
                </span>
                <div>
                  <div className="strong">You're now an employee 🎉</div>
                  <div>
                    Employee ID <span className="mono">{employee.id}</span> · {employee.position} · joined {formatDate(employee.joiningDate)}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="stack gap-5">
          <Card title="Application details">
            <InfoList
              items={[
                { label: 'Candidate ID', value: app.candidateId },
                { label: 'Application ID', value: app.id },
                { label: 'Position', value: app.jobTitle },
                { label: 'Submitted', value: formatDate(app.submittedAt) },
                { label: 'Assigned To', value: app.assignedTo },
              ]}
            />
          </Card>
          <Card title="Activity">
            <ActivityTimeline items={activities} />
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
        onConfirm={() => {
          declineOffer(offer.id);
          setDeclineOpen(false);
          toast.success('Offer declined.');
        }}
      />
    </div>
  );
}
