import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TAHeader from '../../components/ta/TAHeader.jsx';
import Card from '../../components/ta/Card.jsx';
import KpiCard from '../../components/ta/KpiCard.jsx';
import StageFunnel from '../../components/ta/StageFunnel.jsx';
import DonutChart from '../../components/ta/DonutChart.jsx';
import Tag from '../../components/ta/Tag.jsx';
import Icon from '../../components/common/Icon.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { DEMO_USERS, ROLES } from '../../constants/roles.js';
import { APP_STATUS, OFFER_STATUS, hrStageRank } from '../../constants/statuses.js';
import { timeAgo, formatDate } from '../../utils/format.js';

const HANDOVER_PREVIEW = 3;

export default function HRDashboard() {
  const navigate = useNavigate();
  const { data, offerFor, activitiesFor } = useApp();
  const user = DEMO_USERS[ROLES.HR];
  const [handoverAll, setHandoverAll] = useState(false);    // show every row past the preview

  // ----- DATA -----
  const apps = data.applications || [];
  const offers = data.offers || [];
  const employees = data.employees || [];
  const now = new Date();

  // ----- CALCULATIONS -----
  const pendingVerification = apps.filter((a) => a.status === APP_STATUS.HR_VERIFICATION);
  // TA has done its part: candidate accepted, HR has not started onboarding yet.
  const handovers = apps.filter((a) => a.status === APP_STATUS.ONBOARDING_PENDING);

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
    const d = new Date(e.joiningDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const everReachedHR = apps.filter((a) => hrStageRank(a.status) >= 0).length;

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

  // ===== HR Onboarding Progress — the actual workflow after the TA → HR handover.
  // Each stage is a subset of the one before it, so the funnel only narrows. =====
  const accepted = apps.filter((a) => hrStageRank(a.status) >= 2);
  const stages = [
    { label: 'Offer Accepted', tone: 'violet', value: accepted.length, to: '/hr/candidates?stage=onboarding' },
    { label: 'Joining Documents', tone: 'blue', value: accepted.filter((a) => a.onboarding).length, to: '/hr/candidates?stage=verification' },
    { label: 'Documents Verified', tone: 'teal', value: accepted.filter((a) => hrStageRank(a.status) >= 4).length, to: '/hr/candidates?stage=joining' },
    { label: 'Employee Created', tone: 'amber', value: employees.length, to: '/hr/employees' },
    { label: 'Onboarded', tone: 'green', value: employees.filter((e) => new Date(e.joiningDate) <= now).length, to: '/hr/employees' },
  ];
  const funnelStages = stages.map((s) => ({ ...s, onClick: () => navigate(s.to) }));
  // Small, quiet insight: how much work is still in the document phase.
  const awaitingDocs = stages[0].value - stages[2].value;

  // ===== Upcoming Joiners — when is the incoming workforce expected to start? =====
  const daysUntil = (dateStr) => (dateStr ? Math.ceil((new Date(dateStr) - Date.now()) / 86400000) : null);
  const upcoming = accepted
    .filter((a) => a.status !== APP_STATUS.EMPLOYEE)
    .map((a) => daysUntil(offerFor(a.id)?.joiningDate))
    .filter((d) => d != null);
  const between = (lo, hi) => upcoming.filter((d) => d <= hi && (lo == null || d > lo)).length;
  const joinerSlices = [
    { label: 'Within 7 days', value: between(null, 7), color: '#46c98a' },
    { label: '8–30 days', value: between(7, 30), color: '#4b7bf7' },
    { label: '31–60 days', value: between(30, 60), color: '#8b7ff0' },
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

      {handovers.length > 0 && (
        <section className="hr-handover">
          <div className="hr-handover__head">
            <span className="hr-handover__lead">
              <Icon name="CheckCircle2" size={15} />
              <strong>New HR Handover</strong>
              <span className="hr-handover__count">{handovers.length}</span>
            </span>
            <span className="hr-handover__from">Accepted offers passed from Talent Acquisition</span>
          </div>
          <div className="hr-handover__list">
            {(handoverAll ? handovers : handovers.slice(0, HANDOVER_PREVIEW)).map((a) => (
              <button
                key={a.id}
                type="button"
                className="hr-handover__row"
                onClick={() => navigate(`/hr/candidates/${a.candidateId}`)}
              >
                <span className="hr-handover__who">
                  <strong>{a.personal.firstName} {a.personal.lastName}</strong>
                  <span className="ta-cell-sub">{a.jobTitle}</span>
                </span>
                <span className="hr-handover__go">Start onboarding <Icon name="ArrowRight" size={13} /></span>
              </button>
            ))}
          </div>
          {handovers.length > HANDOVER_PREVIEW && (
            <button type="button" className="hr-handover__more" onClick={() => setHandoverAll((v) => !v)}>
              {handoverAll ? 'Show fewer' : `Show all ${handovers.length}`}
              <Icon name={handoverAll ? 'ChevronUp' : 'ChevronDown'} size={14} />
            </button>
          )}
        </section>
      )}

      <div className="ta-bento">
        <Card
          title="Documents Awaiting Verification"
          action={<button className="ta-link" onClick={() => navigate('/hr/candidates?stage=verification')}>View all</button>}
          bodyStyle={{ justifyContent: 'flex-start' }}
        >
          {pendingVerification.length === 0 ? (
            <p className="ta-cell-mute">No documents waiting on verification — you're all caught up.</p>
          ) : (
            <>
              <p className="ta-cell-sub" style={{ marginBottom: 12 }}>
                {pendingVerification.length} candidate{pendingVerification.length === 1 ? '' : 's'} submitted joining documents and are waiting on your review.
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
                      <Icon name="ChevronRight" size={16} />
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
            <p className="ta-cell-mute">No confirmed joining dates yet — they appear here once documents are verified.</p>
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
        <Card title="HR Onboarding Progress">
          <StageFunnel stages={funnelStages} />
          {awaitingDocs > 0 && (
            <p className="ta-sfunnel__insight">
              <Icon name="Info" size={13} />
              {awaitingDocs} candidate{awaitingDocs === 1 ? '' : 's'} still awaiting document submission or verification.
            </p>
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
