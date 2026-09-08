import { useNavigate } from 'react-router-dom';
import TAHeader from '../../components/ta/TAHeader.jsx';
import Card from '../../components/ta/Card.jsx';
import KpiCard from '../../components/ta/KpiCard.jsx';
import FunnelChart from '../../components/ta/FunnelChart.jsx';
import DonutChart from '../../components/ta/DonutChart.jsx';
import Tag from '../../components/ta/Tag.jsx';
import Icon from '../../components/common/Icon.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { DEMO_USERS, ROLES } from '../../constants/roles.js';
import { APP_STATUS, OFFER_STATUS, DOC_STATUS, hrStageRank } from '../../constants/statuses.js';
import { timeAgo, formatDate } from '../../utils/format.js';

export default function HRDashboard() {
  const navigate = useNavigate();
  const { data, offerFor, documentsFor, activitiesFor } = useApp();
  const user = DEMO_USERS[ROLES.HR];

  // ----- DATA -----
  const apps = data.applications || [];
  const offers = data.offers || [];
  const employees = data.employees || [];

  // ----- FILTERING -----
  const pendingVerification = apps.filter((a) => a.status === APP_STATUS.HR_VERIFICATION);

  // ----- CALCULATIONS -----
  const onboardingStatuses = [
    APP_STATUS.ONBOARDING_PENDING, APP_STATUS.HR_VERIFICATION,
    APP_STATUS.HR_VERIFICATION_REJECTED, APP_STATUS.JOINING_PENDING,
  ];
  const inOnboarding = apps.filter((a) => onboardingStatuses.includes(a.status)).length;
  const issuedCount = apps.filter((a) => a.status === APP_STATUS.OFFER_ISSUED).length;
  const acceptedCount = offers.filter((o) => o.status === OFFER_STATUS.ACCEPTED).length;
  const offersOut = issuedCount + acceptedCount;
  const joiningPending = apps.filter((a) => a.status === APP_STATUS.JOINING_PENDING).length;
  const joinedThisMonth = employees.filter((e) => {
    const d = new Date(e.joiningDate); const n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).length;
  const everReachedHR = apps.filter((a) => hrStageRank(a.status) >= 0).length;

  // Each KPI shows the number in context (a share of a total it belongs to),
  // so the reader knows whether "3" is a lot or a little.
  const kpis = [
    {
      icon: 'ClipboardCheck', label: 'Awaiting Verification', accent: 'amber', value: pendingVerification.length,
      meter: { value: pendingVerification.length, max: Math.max(1, inOnboarding) },
      note: `of ${inOnboarding} candidates in onboarding`,
      onClick: () => navigate('/hr/candidates?stage=verification'),
    },
    {
      icon: 'Send', label: 'Offers Awaiting Reply', accent: 'blue', value: issuedCount,
      meter: { value: issuedCount, max: Math.max(1, offersOut) },
      note: `of ${offersOut} extended · ${acceptedCount} accepted`,
      onClick: () => navigate(`/hr/candidates?offer=${OFFER_STATUS.ISSUED}`),
    },
    {
      icon: 'CalendarClock', label: 'Joining Soon', accent: 'violet', value: joiningPending,
      meter: { value: joiningPending, max: Math.max(1, joiningPending + employees.length) },
      note: 'in the joining stage or onboarded',
      onClick: () => navigate('/hr/employees'),
    },
    {
      icon: 'UserRoundCheck', label: 'Onboarded', accent: 'green', value: employees.length,
      meter: { value: employees.length, max: Math.max(1, everReachedHR) },
      note: `of ${everReachedHR} who reached HR${joinedThisMonth > 0 ? ` · ${joinedThisMonth} this month` : ''}`,
      onClick: () => navigate('/hr/employees'),
    },
  ];

  // ===== ANALYTIC 1 — Onboarding Completion =====
  // Everyone HR owns: they accepted the offer and are somewhere in onboarding.
  const hrApps = apps.filter((a) => hrStageRank(a.status) >= 2);
  const reqDocs = (a) => documentsFor(a.id).filter((d) => d.required);
  const docsSubmitted = (a) => { const d = reqDocs(a); return d.length > 0 && d.every((x) => x.status !== DOC_STATUS.PENDING && x.status !== DOC_STATUS.REJECTED); };
  const docsVerified = (a) => { const d = reqDocs(a); return d.length > 0 && d.every((x) => x.status === DOC_STATUS.VERIFIED); };

  // Each stage is a subset of the one above it, so the funnel always narrows.
  const s1 = hrApps;
  const s2 = s1.filter(docsSubmitted);
  const s3 = s2.filter(docsVerified);
  const s4 = s3.filter((a) => hrStageRank(a.status) >= 4);          // HR verified the onboarding forms
  const s5 = s4.filter((a) => !!offerFor(a.id)?.joiningDate);        // a joining date is locked in
  const s6 = s5.filter((a) => hrStageRank(a.status) >= 5);          // now an employee
  const completion = [
    { label: 'Offer Accepted', icon: 'FileCheck', tone: 'violet', value: s1.length },
    { label: 'Documents Completed', icon: 'Files', tone: 'blue', value: s2.length },
    { label: 'Verification Completed', icon: 'CheckCircle2', tone: 'teal', value: s3.length },
    { label: 'HR Formalities Completed', icon: 'ClipboardCheck', tone: 'amber', value: s4.length },
    { label: 'Joining Confirmed', icon: 'CalendarCheck', tone: 'blue', value: s5.length },
    { label: 'Onboarded', icon: 'UserRoundCheck', tone: 'green', value: s6.length },
  ];
  // Where does onboarding lose the most people?
  let drop = { from: '', to: '', n: 0, key: null };
  for (let i = 1; i < completion.length; i += 1) {
    const n = completion[i - 1].value - completion[i].value;
    if (n > drop.n) drop = { from: completion[i - 1].label, to: completion[i].label, n, key: completion[i].label };
  }

  // ===== ANALYTIC 2 — Upcoming Joiners (workforce planning) =====
  const daysUntil = (dateStr) => (dateStr ? Math.ceil((new Date(dateStr) - Date.now()) / 86400000) : null);
  const upcoming = hrApps
    .filter((a) => a.status !== APP_STATUS.EMPLOYEE)
    .map((a) => daysUntil(offerFor(a.id)?.joiningDate))
    .filter((d) => d != null);
  const inRange = (min, max) => upcoming.filter((d) => d <= max && (min == null || d > min)).length;
  const joinerSlices = [
    { label: 'Within 7 days', value: inRange(null, 7), color: '#46c98a' },
    { label: '8–30 days', value: inRange(7, 30), color: '#4b7bf7' },
    { label: '31–60 days', value: inRange(30, 60), color: '#8b7ff0' },
    { label: '60+ days', value: upcoming.filter((d) => d > 60).length, color: '#f6a04a' },
  ];
  const joiningWithin30 = joinerSlices[0].value + joinerSlices[1].value;

  // Confirmed joining dates — HR must plan around these (kit, access, day-1).
  const joiningSchedule = apps
    .filter((a) => a.status === APP_STATUS.JOINING_PENDING)
    .map((a) => ({ a, joiningDate: offerFor(a.id)?.joiningDate }))
    .filter((x) => x.joiningDate)
    .sort((x, y) => new Date(x.joiningDate) - new Date(y.joiningDate))
    .slice(0, 6);

  return (
    <>
      <TAHeader title="Dashboard" subtitle={`Welcome back, ${user.name}`} />

      <div className="ta-kpi-row">
        {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>

      <div className="ta-bento">
        <Card
          title="Needs Onboarding Verification"
          action={<button className="ta-link" onClick={() => navigate('/hr/candidates')}>View all candidates</button>}
          bodyStyle={{ justifyContent: 'flex-start' }}
        >
          {pendingVerification.length === 0 ? (
            <p className="ta-cell-mute">No candidates waiting on verification — you're all caught up.</p>
          ) : (
            <>
              <p className="ta-cell-sub" style={{ marginBottom: 12 }}>
                {pendingVerification.length} candidate{pendingVerification.length === 1 ? '' : 's'} submitted onboarding forms and are waiting on your review.
              </p>
              <div className="ta-pipe">
                {pendingVerification.map((a) => {
                  const name = `${a.personal.firstName} ${a.personal.lastName}`;
                  const department = offerFor(a.id)?.department || 'General';
                  const submittedActivity = activitiesFor(a.id).find((act) => act.title === 'Onboarding Forms Submitted');
                  return (
                    <button
                      key={a.id}
                      className="ta-pipe__row"
                      onClick={() => navigate(`/hr/candidates/${a.candidateId}`)}
                    >
                      <span className="ta-pipe__label">
                        {name}
                        <br />
                        <span className="ta-cell-sub">{a.jobTitle} · {department}</span>
                      </span>
                      {submittedActivity && <Tag tone="amber">Submitted {timeAgo(submittedActivity.at)}</Tag>}
                      <Icon name="ArrowRight" size={15} />
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </Card>

        <Card
          title="Joining Schedule"
          action={<button className="ta-link" onClick={() => navigate('/hr/employees')}>All employees</button>}
          bodyStyle={{ justifyContent: 'flex-start' }}
        >
          {joiningSchedule.length === 0 ? (
            <p className="ta-cell-mute">No confirmed joining dates yet — they appear here once an offer is accepted.</p>
          ) : (
            <div className="hr-joiners hr-joiners--stack">
              {joiningSchedule.map(({ a, joiningDate }) => {
                const d = Math.round((new Date(joiningDate) - Date.now()) / 86400000);
                return (
                  <button
                    key={a.id}
                    className="hr-joiners__row"
                    onClick={() => navigate(`/hr/candidates/${a.candidateId}`)}
                  >
                    <span className="hr-joiners__icon"><Icon name="CalendarCheck" size={16} /></span>
                    <span className="hr-joiners__text">
                      <span className="ta-cell-strong">{a.personal.firstName} {a.personal.lastName}</span>
                      <span className="ta-cell-sub">{a.jobTitle} · joins {formatDate(joiningDate)}</span>
                    </span>
                    <Tag tone={d <= 7 ? 'green' : 'blue'}>{d <= 0 ? 'Due now' : `in ${d}d`}</Tag>
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <div className="ta-bento">
        <Card title="Onboarding Completion">
          <div className="ta-pipe-wrap">
            <div className="ta-pipe">
              {completion.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  className={`ta-pipe__row${s.label === drop.key ? ' ta-pipe__row--active' : ''}`}
                  onClick={() => navigate('/hr/candidates')}
                >
                  <span
                    className="ta-pipe__icon"
                    style={{ '--p-bg': `var(--tag-${s.tone}-bg)`, '--p-fg': `var(--tag-${s.tone}-fg)` }}
                  >
                    <Icon name={s.icon} size={15} />
                  </span>
                  <span className="ta-pipe__label">{s.label}</span>
                  <span className="ta-pipe__count">
                    {s.value}
                    <span className="ta-pipe__pct">{completion[0].value ? Math.round((s.value / completion[0].value) * 100) : 0}%</span>
                  </span>
                </button>
              ))}
            </div>
            <FunnelChart stages={completion} labelMode="count" />
          </div>
          {drop.n > 0 && (
            <div className="ta-note" style={{ margin: '14px 0 0', background: 'var(--ta-blue-wash)', color: 'var(--ta-text)' }}>
              <Icon name="ArrowDown" size={15} />
              <span>Biggest drop-off: <strong>{drop.from} → {drop.to}</strong> ({drop.n} employee{drop.n === 1 ? '' : 's'} not through yet).</span>
            </div>
          )}
        </Card>

        <Card title="Upcoming Joiners">
          <DonutChart
            slices={joinerSlices}
            caption="joining"
            onSliceClick={() => navigate('/hr/employees')}
          />
          <div className="ta-note" style={{ margin: '12px 0 0', background: 'var(--ta-blue-wash)', color: 'var(--ta-text)' }}>
            <Icon name="CalendarClock" size={15} />
            <span><strong>{joiningWithin30} joining in the next 30 days</strong> — {joinerSlices[0].value} within a week.</span>
          </div>
        </Card>
      </div>
    </>
  );
}
