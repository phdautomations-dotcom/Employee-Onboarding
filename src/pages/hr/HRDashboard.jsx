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
  const taName = DEMO_USERS[ROLES.TA].name;
  const [handoverOpen, setHandoverOpen] = useState(true);   // collapse the whole list
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

  // ===== HR Onboarding Progress — the workflow after the TA → HR handover.
  // Cumulative: each stage counts everyone who reached it or further, so the
  // funnel only narrows, and the count matches what its filter shows. =====
  const accepted = apps.filter((a) => hrStageRank(a.status) >= 2);
  const stages = [
    { label: 'Offer Accepted', tone: 'violet', value: accepted.length, to: '/hr/candidates?stage=onboarding' },
    { label: 'Joining Documents', tone: 'blue', value: accepted.filter((a) => a.onboarding).length, to: '/hr/candidates?stage=verification' },
    { label: 'Documents Verified', tone: 'teal', value: accepted.filter((a) => hrStageRank(a.status) >= 4).length, to: '/hr/candidates?stage=joining' },
    { label: 'Onboarded', tone: 'green', value: accepted.filter((a) => hrStageRank(a.status) >= 5).length, to: '/hr/candidates?stage=onboarded' },
  ];
  const funnelStages = stages.map((s) => ({ ...s, onClick: () => navigate(s.to) }));
  // Small, quiet insight: how much work is still in the document phase.
  const awaitingDocs = stages[0].value - stages[2].value;

  // ===== Upcoming Joiners — merges the joining schedule + the timing donut.
  // Everyone who accepted and has a target joining date but hasn't joined. =====
  const daysUntil = (dateStr) => (dateStr ? Math.ceil((new Date(dateStr) - Date.now()) / 86400000) : null);
  const upcomingJoiners = accepted
    .filter((a) => a.status !== APP_STATUS.EMPLOYEE)
    .map((a) => ({ a, joiningDate: offerFor(a.id)?.joiningDate }))
    .filter((x) => x.joiningDate)
    .map((x) => ({ ...x, d: daysUntil(x.joiningDate) }))
    .sort((x, y) => x.d - y.d);
  const inWindow = (lo, hi) => upcomingJoiners.filter((x) => x.d <= hi && (lo == null || x.d > lo)).length;
  const joinerSlices = [
    { label: 'Within 7 days', value: inWindow(null, 7), color: '#46c98a' },
    { label: '8–30 days', value: inWindow(7, 30), color: '#4b7bf7' },
    { label: '31–60 days', value: inWindow(30, 60), color: '#8b7ff0' },
    { label: '60+ days', value: upcomingJoiners.filter((x) => x.d > 60).length, color: '#f6a04a' },
  ];

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
            <button
              type="button"
              className="hr-handover__collapse"
              onClick={() => setHandoverOpen((v) => !v)}
              aria-label={handoverOpen ? 'Collapse' : 'Expand'}
            >
              <Icon name={handoverOpen ? 'ChevronUp' : 'ChevronDown'} size={16} />
            </button>
          </div>
          {handoverOpen && (
            <>
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
                    <span className="hr-handover__taname">{taName}</span>
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
            </>
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
          title="HR Onboarding Progress"
          action={<span className="ta-cell-sub">{accepted.length} in onboarding</span>}
        >
          <StageFunnel stages={funnelStages} />
          {awaitingDocs > 0 && (
            <p className="ta-sfunnel__insight">
              <Icon name="Info" size={13} />
              {awaitingDocs} candidate{awaitingDocs === 1 ? '' : 's'} still awaiting document submission or verification.
            </p>
          )}
        </Card>
      </div>

      <Card
        title="Upcoming Joiners"
        action={<span className="ta-cell-sub">{upcomingJoiners.length} expected · {joinerSlices[0].value} within a week</span>}
      >
        {upcomingJoiners.length === 0 ? (
          <p className="ta-cell-mute">No upcoming joiners yet — they appear once an offer is accepted with a joining date.</p>
        ) : (
          <div className="hr-upcoming">
            <DonutChart slices={joinerSlices} caption="joining" onSliceClick={() => navigate('/hr/employees')} />
            <div className="hr-nextjoin">
              <div className="hr-nextjoin__head">Next to join</div>
              {upcomingJoiners.slice(0, 5).map(({ a, d }) => (
                <button
                  key={a.id}
                  type="button"
                  className="hr-nextjoin__row"
                  onClick={() => navigate(`/hr/candidates/${a.candidateId}`)}
                >
                  <span className="hr-nextjoin__name">{a.personal.firstName} {a.personal.lastName}</span>
                  <span className={`hr-nextjoin__d${d <= 7 ? ' is-soon' : ''}`}>{d <= 0 ? 'Due now' : `in ${d}d`}</span>
                </button>
              ))}
              {upcomingJoiners.length > 5 && (
                <button className="ta-link hr-nextjoin__all" onClick={() => navigate('/hr/candidates?stage=onboarding')}>
                  View all {upcomingJoiners.length} upcoming joiners
                </button>
              )}
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
