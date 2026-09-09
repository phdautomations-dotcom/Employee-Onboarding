import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../common/Icon.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { ROLES } from '../../constants/roles.js';
import { APP_STATUS, DOC_STATUS } from '../../constants/statuses.js';

/* How far along the happy path a status sits. Higher = further. */
const ORD = {
  [APP_STATUS.SUBMITTED]: 1,
  [APP_STATUS.RETURNED]: 1,
  [APP_STATUS.TA_REVIEW]: 2,
  [APP_STATUS.INTERVIEW_PLANNING]: 3,
  [APP_STATUS.INTERVIEW_IN_PROGRESS]: 4,
  [APP_STATUS.INTERVIEW_PASSED]: 5,
  [APP_STATUS.DOC_VERIFICATION]: 6,
  [APP_STATUS.DOCS_VERIFIED]: 8,
  [APP_STATUS.OFFER_DRAFT]: 8,
  [APP_STATUS.OFFER_ISSUED]: 9,
  [APP_STATUS.OFFER_ACCEPTED]: 10,
  [APP_STATUS.ONBOARDING_PENDING]: 10,
  [APP_STATUS.HR_VERIFICATION_REJECTED]: 10,
  [APP_STATUS.HR_VERIFICATION]: 11,
  [APP_STATUS.JOINING_PENDING]: 12,
  [APP_STATUS.EMPLOYEE]: 13,
};

const CAND = '/candidate/application';
const STEPS = [
  { role: ROLES.CANDIDATE, who: 'Candidate', title: 'Browse jobs & apply', hint: 'Open a role, review it, and submit the application form.', to: () => '/candidate/jobs', at: 1 },
  { role: ROLES.TA, who: 'Talent Acquisition', title: 'Review the application', hint: 'Open the new applicant and click “Start review”.', to: (a) => `/ta/candidates/${a.candidateId}`, at: 2 },
  { role: ROLES.TA, who: 'Talent Acquisition', title: 'Approve the candidate', hint: 'Approve to move them into interview planning.', to: (a) => `/ta/candidates/${a.candidateId}`, at: 3 },
  { role: ROLES.TA, who: 'Talent Acquisition', title: 'Schedule an interview', hint: 'Add an interview round with a date and interviewer.', to: (a) => `/ta/candidates/${a.candidateId}`, at: 4 },
  { role: ROLES.TA, who: 'Talent Acquisition', title: 'Record the result', hint: 'Mark the interview round as Passed.', to: (a) => `/ta/candidates/${a.candidateId}`, at: 5 },
  { role: ROLES.TA, who: 'Talent Acquisition', title: 'Move to documents', hint: 'Send the candidate to document verification.', to: (a) => `/ta/candidates/${a.candidateId}`, at: 6 },
  { role: ROLES.CANDIDATE, who: 'Candidate', title: 'Upload documents', hint: 'Upload each verification document from “My Application”.', to: () => CAND, docsDone: true, at: 8 },
  { role: ROLES.TA, who: 'Talent Acquisition', title: 'Verify the documents', hint: 'Verify each uploaded document.', to: (a) => `/ta/candidates/${a.candidateId}`, at: 8 },
  { role: ROLES.TA, who: 'Talent Acquisition', title: 'Prepare & send the offer', hint: 'Fill the offer details and send it to the candidate.', to: (a) => `/ta/candidates/${a.candidateId}`, at: 9 },
  { role: ROLES.CANDIDATE, who: 'Candidate', title: 'Accept the offer', hint: 'Review the offer and accept it.', to: () => CAND, at: 10 },
  { role: ROLES.CANDIDATE, who: 'Candidate', title: 'Fill onboarding details', hint: 'Complete the onboarding form and submit it to HR.', to: () => CAND, at: 11 },
  { role: ROLES.HR, who: 'Human Resources', title: 'Verify onboarding', hint: 'Review the submitted details and verify them.', to: (a) => `/hr/candidates/${a.candidateId}`, at: 12 },
  { role: ROLES.HR, who: 'Human Resources', title: 'Complete joining', hint: 'Mark joining complete — this creates the employee record.', to: (a) => `/hr/candidates/${a.candidateId}`, at: 13 },
];

const OPEN_KEY = 'talentflow.demo.open';

export default function DemoFlow() {
  const navigate = useNavigate();
  const { data, getApplication, documentsFor, setRole, startGuidedDemo } = useApp();
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem(OPEN_KEY) === '1'; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem(OPEN_KEY, open ? '1' : '0'); } catch { /* ignore */ }
  }, [open]);

  const app = data?.myApplicationId ? getApplication(data.myApplicationId) : null;
  const pos = app ? (ORD[app.status] ?? 0) : 0;
  const docsUploaded = app
    ? documentsFor(app.id).filter((d) => d.required).every((d) => d.status === DOC_STATUS.UPLOADED || d.status === DOC_STATUS.VERIFIED)
      && documentsFor(app.id).some((d) => d.required)
    : false;

  const isDone = (s) => (s.docsDone ? pos >= s.at || docsUploaded : pos >= s.at);
  const currentIndex = STEPS.findIndex((s) => !isDone(s));
  const allDone = currentIndex === -1;
  const doneCount = allDone ? STEPS.length : currentIndex;

  const goToStep = (s) => {
    setRole(s.role);
    navigate(s.to(app || {}));
  };
  const restart = () => {
    startGuidedDemo();
    setRole(ROLES.CANDIDATE);
    navigate('/candidate/jobs');
  };

  if (!open) {
    return (
      <button type="button" className="demoflow__fab" onClick={() => setOpen(true)}>
        <Icon name="Route" size={15} />
        Guided demo
        <span className="demoflow__fabcount">{doneCount}/{STEPS.length}</span>
      </button>
    );
  }

  return (
    <aside className="demoflow" aria-label="Guided demo">
      <header className="demoflow__head">
        <span className="demoflow__title">
          <Icon name="Route" size={15} />
          Candidate → TA → HR
        </span>
        <div className="demoflow__headbtns">
          <button type="button" onClick={restart} title="Restart from the beginning"><Icon name="RotateCcw" size={14} /></button>
          <button type="button" onClick={() => setOpen(false)} title="Hide"><Icon name="X" size={15} /></button>
        </div>
      </header>

      <div className="demoflow__bar"><span style={{ width: `${(doneCount / STEPS.length) * 100}%` }} /></div>
      <p className="demoflow__sub">
        {allDone
          ? 'Full lifecycle complete — the candidate is now an employee.'
          : `Step ${doneCount + 1} of ${STEPS.length} · ${STEPS[currentIndex].who}`}
      </p>

      <ol className="demoflow__list">
        {STEPS.map((s, i) => {
          const done = isDone(s);
          const active = i === currentIndex;
          return (
            <li key={s.title} className={`demoflow__step${done ? ' is-done' : ''}${active ? ' is-active' : ''}`}>
              <span className="demoflow__dot">
                {done ? <Icon name="Check" size={12} /> : i + 1}
              </span>
              <div className="demoflow__body">
                <span className="demoflow__steptitle">{s.title}</span>
                <span className="demoflow__who">{s.who}</span>
                {active && (
                  <>
                    <span className="demoflow__hint">{s.hint}</span>
                    <button type="button" className="demoflow__go" onClick={() => goToStep(s)} disabled={s.at > 1 && !app}>
                      Take me there <Icon name="ArrowRight" size={13} />
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {allDone && (
        <button type="button" className="demoflow__go demoflow__restart" onClick={restart}>
          <Icon name="RotateCcw" size={13} /> Run it again
        </button>
      )}
    </aside>
  );
}
