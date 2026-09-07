import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Icon from '../common/Icon.jsx';
import Button from '../common/Button.jsx';
import { Card, InfoList } from '../common/Card.jsx';
import { Badge, StatusBadge } from '../common/Badge.jsx';
import Avatar from '../common/Avatar.jsx';
import { ActivityTimeline } from '../common/Timeline.jsx';
import { EmptyState } from '../common/States.jsx';
import ReasonModal from './ReasonModal.jsx';
import ScheduleInterviewModal from './ScheduleInterviewModal.jsx';
import InterviewResultModal from './InterviewResultModal.jsx';
import OfferDrawer from './OfferDrawer.jsx';
import DocumentTable from './DocumentTable.jsx';
import RecruitmentTimeline from './RecruitmentTimeline.jsx';
import OnboardingJourney from './OnboardingJourney.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { findJob } from '../../data/jobs.js';
import {
  APP_STATUS,
  ROUND_STATUS,
  ROUND_STATUS_META,
  OFFER_STATUS,
  OFFER_STATUS_META,
  PIPELINE_STAGES,
  stageIndexForStatus,
} from '../../constants/statuses.js';
import { formatDate, formatCurrencyINR } from '../../utils/format.js';

const TABS = ['Overview', 'Journey', 'Experience', 'Education', 'Skills', 'Resume', 'Interviews', 'Documents', 'Offer', 'Activity'];

export default function CandidateProfile({ application: app, role }) {
  const {
    interviewsFor,
    documentsFor,
    offerFor,
    employeeFor,
    activitiesFor,
    startReview,
    approveApplication,
    returnApplication,
    rejectApplication,
    scheduleInterview,
    recordInterviewResult,
    advanceToDocuments,
    verifyDocument,
    rejectDocument,
    saveOffer,
    approveOffer,
    returnOffer,
    completeJoining,
  } = useApp();
  const toast = useToast();

  const [sp] = useSearchParams();
  const initialTab = TABS.find((t) => t.toLowerCase() === (sp.get('tab') || '').toLowerCase()) || 'Overview';
  const [tab, setTab] = useState(initialTab);
  const [modal, setModal] = useState(null); // 'return' | 'reject' | 'schedule' | 'offer' | 'offerReturn'
  const [resultFor, setResultFor] = useState(null);

  useEffect(() => {
    if (role === 'ta' && app.status === APP_STATUS.SUBMITTED) startReview(app.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.id]);

  const job = app.jobId ? findJob(app.jobId) : null;
  const interviews = interviewsFor(app.id);
  const documents = documentsFor(app.id);
  const offer = offerFor(app.id);
  const employee = employeeFor(app.id);
  const activities = activitiesFor(app.id);
  const name = `${app.personal.firstName} ${app.personal.lastName}`;

  const inReview = [APP_STATUS.SUBMITTED, APP_STATUS.TA_REVIEW].includes(app.status);
  const inInterview = [APP_STATUS.INTERVIEW_PLANNING, APP_STATUS.INTERVIEW_IN_PROGRESS, APP_STATUS.INTERVIEW_PASSED].includes(app.status);
  const canPrepareOffer = [APP_STATUS.DOCS_VERIFIED, APP_STATUS.OFFER_DRAFT].includes(app.status);
  const canVerifyDocs = ['ta', 'hr'].includes(role) && [APP_STATUS.DOC_VERIFICATION, APP_STATUS.DOCS_VERIFIED].includes(app.status);

  const scheduledCount = interviews.filter((i) => i.status === ROUND_STATUS.SCHEDULED).length;

  const stageIdx = Math.max(0, stageIndexForStatus(app.status));
  const progressPct = app.status === APP_STATUS.REJECTED ? 0 : Math.round(((stageIdx + 1) / PIPELINE_STAGES.length) * 100);

  return (
    <div className="page-body">
      <div className="detail-header">
        <div className="grow">
          <div className="identity">
            <Avatar name={name} size="xl" />
            <div>
              <h1 className="page-title">{name}</h1>
              <div className="text-small text-secondary mt-1">
                <span className="mono">{app.candidateId}</span> · <span className="mono">{app.id}</span> · {app.jobTitle}
              </div>
              <div className="row gap-2 mt-2 wrap">
                <StatusBadge status={app.status} />
                {employee && <Badge tone="success" icon="UserRoundCheck">{employee.id}</Badge>}
              </div>
            </div>
          </div>

          <div className="fact-strip">
            <div className="fact">
              <span className="fact__label">Experience</span>
              <span className="fact__value">{app.professional.totalExperience || '—'} yrs</span>
            </div>
            <div className="fact">
              <span className="fact__label">Current</span>
              <span className="fact__value">{app.professional.currentCompany || '—'}</span>
            </div>
            <div className="fact">
              <span className="fact__label">Expected CTC</span>
              <span className="fact__value">{formatCurrencyINR(app.professional.expectedCTC)}</span>
            </div>
            <div className="fact">
              <span className="fact__label">Notice</span>
              <span className="fact__value">{app.professional.noticePeriod || '—'}</span>
            </div>
          </div>

          {app.status !== APP_STATUS.REJECTED && (
            <div className="mt-4" style={{ maxWidth: 420 }}>
              <div className="row between text-xs text-secondary mb-2">
                <span>Pipeline progress</span>
                <span>{PIPELINE_STAGES[stageIdx]?.label}</span>
              </div>
              <div className="progress">
                <div className="progress__bar" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className="row gap-2 wrap">
          {role === 'ta' && inReview && (
            <>
              <Button variant="success" icon="CheckCircle2" onClick={() => { approveApplication(app.id); toast.success('Application approved. Candidate moved to Interview Planning.'); }}>
                Approve
              </Button>
              <Button variant="secondary" icon="RotateCcw" onClick={() => setModal('return')}>
                Return
              </Button>
              <Button variant="danger" icon="XCircle" onClick={() => setModal('reject')}>
                Reject
              </Button>
            </>
          )}
          {role === 'ta' && inInterview && (
            <Button icon="CalendarPlus" onClick={() => setModal('schedule')}>
              Schedule Interview
            </Button>
          )}
          {role === 'ta' && app.status === APP_STATUS.INTERVIEW_PASSED && (
            <Button variant="success" icon="ArrowRight" onClick={() => { advanceToDocuments(app.id); toast.success('Candidate moved to Document Verification.'); }}>
              Proceed to Document Verification
            </Button>
          )}
          {role === 'ta' && canPrepareOffer && (
            <Button icon="FileCheck" onClick={() => setModal('offer')}>
              {offer ? 'Edit Offer' : 'Prepare Offer'}
            </Button>
          )}
          {role === 'hr' && offer && offer.status === OFFER_STATUS.PENDING_APPROVAL && (
            <>
              <Button variant="success" icon="CheckCircle2" onClick={() => { approveOffer(offer.id); toast.success('Offer approved and issued to candidate.'); }}>
                Approve Offer
              </Button>
              <Button variant="secondary" icon="RotateCcw" onClick={() => setModal('offerReturn')}>
                Return for Correction
              </Button>
            </>
          )}
          {role === 'hr' && app.status === APP_STATUS.JOINING_PENDING && (
            <Button variant="success" icon="UserRoundCheck" onClick={() => { completeJoining(app.id); toast.success('Joining completed — employee record created.'); }}>
              Mark Joining Completed
            </Button>
          )}
        </div>
      </div>

      {app.status === APP_STATUS.RETURNED && (
        <div className="alert alert--warning mb-4">
          <span className="alert__icon"><Icon name="RotateCcw" size={16} /></span>
          <div><div className="strong">Returned to candidate</div><div>{app.returnReason}</div></div>
        </div>
      )}
      {app.status === APP_STATUS.REJECTED && (
        <div className="alert alert--error mb-4">
          <span className="alert__icon"><Icon name="XCircle" size={16} /></span>
          <div><div className="strong">Application rejected</div><div>{app.rejectReason}</div></div>
        </div>
      )}

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={`tab${tab === t ? ' tab--active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      <div className="tabpanel" key={tab}>
      {tab === 'Overview' && (
        <div className="detail-grid">
          <Card title="Candidate overview">
            <InfoList
              items={[
                { label: 'Full Name', value: name },
                { label: 'Applied For', value: app.jobTitle },
                { label: 'Application Type', value: app.isGeneral ? 'General Application' : 'Specific Vacancy' },
                { label: 'Total Experience', value: `${app.professional.totalExperience || '—'} years` },
                { label: 'Current Role', value: `${app.professional.currentJobTitle || '—'} @ ${app.professional.currentCompany || '—'}` },
                { label: 'Notice Period', value: app.professional.noticePeriod },
                { label: 'Expected CTC', value: formatCurrencyINR(app.professional.expectedCTC) },
                { label: 'Submitted', value: formatDate(app.submittedAt) },
              ]}
            />
          </Card>
          <Card title="Contact information">
            <InfoList
              items={[
                { label: 'Email', value: app.personal.email },
                { label: 'Mobile', value: app.personal.mobile },
                { label: 'Current Location', value: app.personal.currentLocation },
                { label: 'Preferred Location', value: app.personal.preferredLocation },
                {
                  label: 'Address',
                  value: [app.personal.address?.line1, app.personal.address?.city, app.personal.address?.state, app.personal.address?.country].filter(Boolean).join(', '),
                },
                { label: 'Nationality', value: app.personal.nationality },
              ]}
            />
          </Card>
        </div>
      )}

      {tab === 'Experience' && (
        <Card title="Professional experience">
          <InfoList
            items={[
              { label: 'Current Job Title', value: app.professional.currentJobTitle },
              { label: 'Current Company', value: app.professional.currentCompany },
              { label: 'Total Experience', value: `${app.professional.totalExperience || '—'} years` },
              { label: 'Relevant Experience', value: `${app.professional.relevantExperience || '—'} years` },
              { label: 'Employment Status', value: app.professional.employmentStatus },
              { label: 'Current CTC', value: formatCurrencyINR(app.professional.currentCTC) },
              { label: 'Expected CTC', value: formatCurrencyINR(app.professional.expectedCTC) },
              { label: 'Notice Period', value: app.professional.noticePeriod },
            ]}
          />
        </Card>
      )}

      {tab === 'Education' && (
        <Card title="Education">
          <div className="stack gap-3">
            {app.education.map((e, i) => (
              <div className="round-card" key={e.id || i}>
                <span className="strong">{e.qualification || `Education ${i + 1}`}</span>
                <div className="text-small text-secondary">
                  {[e.university, e.specialization, e.year, e.grade].filter(Boolean).join(' · ') || '—'}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'Skills' && (
        <Card title="Skills, certifications & languages">
          <div className="stack gap-4">
            <div>
              <div className="muted-label mb-2">Skills</div>
              <div className="job-card__skills">
                {app.professional.skills.length ? app.professional.skills.map((s) => <span className="skill-tag" key={s}>{s}</span>) : '—'}
              </div>
            </div>
            <div>
              <div className="muted-label mb-2">Certifications</div>
              <div className="job-card__skills">
                {app.professional.certifications.length ? app.professional.certifications.map((s) => <span className="skill-tag" key={s}>{s}</span>) : '—'}
              </div>
            </div>
            <div>
              <div className="muted-label mb-2">Languages</div>
              <div className="job-card__skills">
                {app.professional.languages.length ? app.professional.languages.map((s) => <span className="skill-tag" key={s}>{s}</span>) : '—'}
              </div>
            </div>
          </div>
        </Card>
      )}

      {tab === 'Resume' && (
        <Card title="Resume">
          {app.resume ? (
            <div className="file-item">
              <span className="file-item__icon"><Icon name="FileText" size={18} /></span>
              <div className="grow">
                <div className="strong text-small">{app.resume.name}</div>
                <div className="text-xs text-secondary">Uploaded {formatDate(app.resume.uploadedAt || app.submittedAt)}</div>
              </div>
              <Button size="sm" variant="secondary" icon="Eye" onClick={() => toast.info('Resume preview is simulated in this prototype.')}>
                View
              </Button>
            </div>
          ) : (
            <EmptyState icon="FileText" title="No resume on file" />
          )}
          {app.autofilled?.length > 0 && (
            <p className="text-xs text-secondary mt-4">
              <Icon name="Sparkles" size={12} /> Some application fields were auto-filled from this resume during submission.
            </p>
          )}
        </Card>
      )}

      {tab === 'Interviews' && (
        <Card
          title="Interview rounds"
          actions={
            role === 'ta' && inInterview ? (
              <Button size="sm" icon="CalendarPlus" onClick={() => setModal('schedule')}>
                Schedule Round {interviews.length + 1}
              </Button>
            ) : null
          }
        >
          {interviews.length === 0 ? (
            <EmptyState icon="CalendarDays" title="No interviews scheduled" message={role === 'ta' ? 'Use “Schedule Interview” to add the first round.' : undefined} />
          ) : (
            <div className="stack gap-3">
              {interviews.map((iv) => {
                const m = ROUND_STATUS_META[iv.status];
                return (
                  <div className="round-card" key={iv.id}>
                    <div className="round-card__head">
                      <span className="strong">Round {iv.round} · {iv.type}</span>
                      <Badge tone={m.tone} icon={m.icon}>{m.label}</Badge>
                    </div>
                    <div className="job-card__meta">
                      <span><Icon name="CalendarDays" size={13} /> {formatDate(iv.date)} at {iv.time}</span>
                      <span><Icon name="Video" size={13} /> {iv.mode}</span>
                      <span><Icon name="User" size={13} /> {iv.interviewer}</span>
                    </div>
                    {iv.link && <div className="text-xs text-secondary">Link: {iv.link}</div>}
                    {iv.location && <div className="text-xs text-secondary">Location: {iv.location}</div>}
                    {iv.notes && <div className="text-xs text-secondary">Notes: {iv.notes}</div>}
                    {iv.result && iv.comments && (
                      <div className="text-xs text-secondary mt-2">Feedback: {iv.comments}</div>
                    )}
                    {role === 'ta' && iv.status === ROUND_STATUS.SCHEDULED && (
                      <div className="mt-2">
                        <Button size="sm" variant="secondary" icon="ClipboardCheck" onClick={() => setResultFor(iv)}>
                          Record Result
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {tab === 'Documents' && (
        <Card title="Documents">
          {documents.length === 0 || ![APP_STATUS.DOC_VERIFICATION, APP_STATUS.DOCS_VERIFIED, APP_STATUS.OFFER_DRAFT, APP_STATUS.OFFER_PENDING_HR, APP_STATUS.OFFER_ISSUED, APP_STATUS.OFFER_ACCEPTED, APP_STATUS.JOINING_PENDING, APP_STATUS.EMPLOYEE].includes(app.status) ? (
            <EmptyState icon="Files" title="Document verification not started" message="Documents become available once all interview rounds are passed." />
          ) : (
            <DocumentTable
              documents={documents}
              candidateName={name}
              onVerify={canVerifyDocs ? (id) => { verifyDocument(id); toast.success('Document verified.'); } : () => toast.warning('Documents can only be verified during the verification stage.')}
              onReject={canVerifyDocs ? (id, reason) => { rejectDocument(id, reason); toast.success('Document rejected — candidate notified.'); } : () => {}}
            />
          )}
        </Card>
      )}

      {tab === 'Offer' && (
        <Card
          title="Offer"
          actions={
            role === 'ta' && canPrepareOffer ? (
              <Button size="sm" icon="FileCheck" onClick={() => setModal('offer')}>
                {offer ? 'Edit Offer' : 'Prepare Offer'}
              </Button>
            ) : null
          }
        >
          {!offer ? (
            <EmptyState icon="FileCheck" title="No offer yet" message={canPrepareOffer ? 'Prepare an offer to move this candidate forward.' : 'An offer can be prepared once all mandatory documents are verified.'} />
          ) : (
            <>
              <div className="row between mb-4">
                <Badge tone={OFFER_STATUS_META[offer.status].tone} icon={OFFER_STATUS_META[offer.status].icon}>
                  {OFFER_STATUS_META[offer.status].label}
                </Badge>
                <span className="text-xs text-secondary">Offer {offer.id}</span>
              </div>
              {offer.returnReason && offer.status === OFFER_STATUS.RETURNED && (
                <div className="alert alert--warning mb-4">
                  <span className="alert__icon" /><div>Returned by HR: {offer.returnReason}</div>
                </div>
              )}
              <div className="offer-letter">
                <h2>Offer of Employment</h2>
                <p>Dear {offer.candidateName},</p>
                <p>We are pleased to offer you the position of <strong>{offer.jobTitle}</strong> in the {offer.department} team, based in {offer.location}.</p>
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
              {role === 'hr' && offer.status === OFFER_STATUS.PENDING_APPROVAL && (
                <div className="row gap-3 mt-4">
                  <Button variant="success" icon="CheckCircle2" onClick={() => { approveOffer(offer.id); toast.success('Offer approved and issued.'); }}>
                    Approve Offer
                  </Button>
                  <Button variant="secondary" icon="RotateCcw" onClick={() => setModal('offerReturn')}>
                    Return for Correction
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      )}

      {tab === 'Journey' && (
        <div className="detail-grid">
          <Card title="Recruitment timeline">
            <RecruitmentTimeline application={app} activities={activities} />
          </Card>
          {[APP_STATUS.OFFER_ACCEPTED, APP_STATUS.JOINING_PENDING, APP_STATUS.EMPLOYEE].includes(app.status) && (
            <Card title="Onboarding journey">
              <OnboardingJourney application={app} documents={documents} offer={offer} employee={employee} />
            </Card>
          )}
        </div>
      )}

      {tab === 'Activity' && (
        <Card title="Activity timeline">
          <ActivityTimeline items={activities} />
        </Card>
      )}
      </div>

      {/* Modals */}
      <ReasonModal
        open={modal === 'return'}
        onClose={() => setModal(null)}
        title="Return Application"
        label="Reason"
        confirmLabel="Return Application"
        tone="secondary"
        onSubmit={(reason) => { returnApplication(app.id, reason); setModal(null); toast.success('Application returned to candidate.'); }}
      />
      <ReasonModal
        open={modal === 'reject'}
        onClose={() => setModal(null)}
        title="Reject Application"
        label="Reason"
        confirmLabel="Reject Candidate"
        tone="danger"
        onSubmit={(reason) => { rejectApplication(app.id, reason); setModal(null); toast.success('Application rejected.'); }}
      />
      <ReasonModal
        open={modal === 'offerReturn'}
        onClose={() => setModal(null)}
        title="Return Offer for Correction"
        label="What needs to change?"
        confirmLabel="Return Offer"
        tone="secondary"
        onSubmit={(reason) => { returnOffer(offer.id, reason); setModal(null); toast.success('Offer returned to Talent Acquisition.'); }}
      />
      <ScheduleInterviewModal
        open={modal === 'schedule'}
        onClose={() => setModal(null)}
        roundNumber={interviews.length + 1}
        onSchedule={(payload) => { scheduleInterview(app.id, payload); setModal(null); toast.success('Interview scheduled successfully.'); }}
      />
      {modal === 'offer' && (
        <OfferDrawer
          open
          onClose={() => setModal(null)}
          application={app}
          job={job}
          existingOffer={offer}
          onSave={(payload, submitForApproval) => {
            saveOffer(app.id, payload, submitForApproval);
            setModal(null);
            toast.success(submitForApproval ? 'Offer submitted for HR approval.' : 'Offer draft saved.');
          }}
        />
      )}
      <InterviewResultModal
        open={!!resultFor}
        onClose={() => setResultFor(null)}
        interview={resultFor}
        onSave={(res) => {
          recordInterviewResult(resultFor.id, res);
          setResultFor(null);
          toast.success('Interview result saved.');
        }}
      />

      {scheduledCount > 1 && role === 'ta' && (
        <p className="text-xs text-secondary mt-4">
          <Icon name="Info" size={12} /> {scheduledCount} rounds are currently scheduled. Record each result to progress the candidate.
        </p>
      )}
    </div>
  );
}
