import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TAHeader from '../../components/ta/TAHeader.jsx';
import Card from '../../components/ta/Card.jsx';
import KpiCard from '../../components/ta/KpiCard.jsx';
import DonutChart from '../../components/ta/DonutChart.jsx';
import StageJourney from '../../components/ta/StageJourney.jsx';
import Tag from '../../components/ta/Tag.jsx';
import Icon from '../../components/common/Icon.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { DEMO_USERS, ROLES } from '../../constants/roles.js';
import { APP_STATUS, hrStageRank } from '../../constants/statuses.js';
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
  const employees = data.employees || [];
  const now = new Date();

  // ----- CALCULATIONS -----
  const pendingVerification = apps.filter((a) => a.status === APP_STATUS.HR_VERIFICATION);
  // TA has done its part: candidate accepted, HR has not started onboarding yet.
  const handovers = apps.filter((a) => a.status === APP_STATUS.ONBOARDING_PENDING);

  const joiningPending = apps.filter((a) => a.status === APP_STATUS.JOINING_PENDING).length;
  const joinedThisMonth = employees.filter((e) => {
    const d = new Date(e.joiningDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  // HR owns candidates from "offer accepted" onward.
  const accepted = apps.filter((a) => hrStageRank(a.status) >= 2);
  const total = accepted.length || 1;

  // ===== Upcoming Joiners — everyone who accepted with a joining date, not
  // joined yet. Sorted soonest first. =====
  const daysUntil = (dateStr) => (dateStr ? Math.ceil((new Date(dateStr) - Date.now()) / 86400000) : null);
  const notJoined = accepted.filter((a) => a.status !== APP_STATUS.EMPLOYEE);
  const upcomingJoiners = notJoined
    .map((a) => ({ a, joiningDate: offerFor(a.id)?.joiningDate }))
    .filter((x) => x.joiningDate)
    .map((x) => ({ ...x, d: daysUntil(x.joiningDate) }))
    .sort((x, y) => x.d - y.d);
  const joiningThisWeek = upcomingJoiners.filter((x) => x.d <= 7).length;

  // ===== KPI tiles = HR's live workload (what needs doing), not the funnel. =====
  const kpis = [
    {
      icon: 'ClipboardCheck', label: 'In Onboarding', accent: 'violet', value: notJoined.length,
      meter: { value: notJoined.length, max: total }, note: `${handovers.length} just handed over`,
      onClick: () => navigate('/hr/candidates?stage=onboarding'),
    },
    {
      icon: 'Eye', label: 'Awaiting Verification', accent: 'amber', value: pendingVerification.length,
      meter: { value: pendingVerification.length, max: Math.max(1, notJoined.length) }, note: 'joining documents to review',
      onClick: () => navigate('/hr/candidates?stage=verification'),
    },
    {
      icon: 'CalendarClock', label: 'Joining This Week', accent: 'blue', value: joiningThisWeek,
      meter: { value: joiningThisWeek, max: Math.max(1, upcomingJoiners.length) }, note: `${upcomingJoiners.length} upcoming in total`,
      onClick: () => navigate('/hr/candidates?stage=joining'),
    },
    {
      icon: 'UserRoundCheck', label: 'Onboarded', accent: 'green', value: employees.length,
      meter: { value: employees.length, max: Math.max(1, total) }, note: `${joinedThisMonth} joined this month`,
      onClick: () => navigate('/hr/employees'),
    },
  ];

  // ===== Onboarding Stage-wise Progress — seven milestones from accepted offer
  // to onboarded. Each stage is a subset of the one before, so counts only fall;
  // the bar / % is the share of the accepted cohort still at that stage or
  // beyond, and every node links to the matching candidate filter. =====
  const handedOver = (a) => activitiesFor(a.id).some((x) => x.title === 'Handed Over to HR');
  const STAGE_DEFS = [
    { label: 'Accepted Offer', icon: 'FileCheck', tone: 'violet', to: '/hr/candidates?stage=onboarding', pred: () => true },
    { label: 'HR Handover', icon: 'Send', tone: 'violet', to: '/hr/candidates?stage=onboarding', pred: handedOver },
    { label: 'Onboarding Started', icon: 'ClipboardList', tone: 'blue', to: '/hr/candidates?stage=onboarding', pred: (a) => a.status !== APP_STATUS.OFFER_ACCEPTED },
    { label: 'Documents Submitted', icon: 'Files', tone: 'blue', to: '/hr/candidates?stage=verification', pred: (a) => !!a.onboarding || hrStageRank(a.status) >= 3 },
    { label: 'Documents Verified', icon: 'CheckCircle2', tone: 'teal', to: '/hr/candidates?stage=verification', pred: (a) => hrStageRank(a.status) >= 4 },
    { label: 'Ready to Join', icon: 'CalendarCheck', tone: 'amber', to: '/hr/candidates?stage=joining', pred: (a) => hrStageRank(a.status) >= 4 && !!offerFor(a.id)?.joiningDate },
    { label: 'Onboarded', icon: 'UserRoundCheck', tone: 'green', to: '/hr/candidates?stage=onboarded', pred: (a) => hrStageRank(a.status) >= 5 },
  ];
  const base = accepted.length || 1;
  const journey = STAGE_DEFS.map((s) => {
    const count = accepted.filter(s.pred).length;
    return {
      label: s.label, icon: s.icon, tone: s.tone, count,
      pct: Math.round((count / base) * 100),
      onClick: () => navigate(s.to),
    };
  });
  // Where onboarding is most held up right now.
  const insightCount = pendingVerification.length;

  // ===== Onboarding by Department — which teams the incoming hires join, so HR
  // can line up equipment, access and inductions per team. =====
  const DEPT_RAMP = ['#4b7bf7', '#8b7ff0', '#f6a04a', '#46c98a', '#3fbfae', '#f2b705'];
  const deptCounts = {};
  notJoined.forEach((a) => {
    const dept = offerFor(a.id)?.department || 'Unassigned';
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  });
  const deptSlices = Object.entries(deptCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], i) => ({ label, value, color: DEPT_RAMP[i % DEPT_RAMP.length] }));

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
          title="Upcoming Joiners"
          action={<span className="ta-cell-sub">{upcomingJoiners.length} expected · {joiningThisWeek} this week</span>}
          bodyStyle={{ justifyContent: 'flex-start' }}
        >
          {upcomingJoiners.length === 0 ? (
            <p className="ta-cell-mute">No upcoming joiners yet — they appear once an offer is accepted with a joining date.</p>
          ) : (
            <div className="hr-nextjoin">
              {upcomingJoiners.slice(0, 6).map(({ a, joiningDate, d }) => (
                <button
                  key={a.id}
                  type="button"
                  className="hr-nextjoin__row"
                  onClick={() => navigate(`/hr/candidates/${a.candidateId}`)}
                >
                  <span className="hr-nextjoin__who">
                    <span className="hr-nextjoin__name">{a.personal.firstName} {a.personal.lastName}</span>
                    <span className="ta-cell-sub">joins {formatDate(joiningDate)}</span>
                  </span>
                  <span className={`hr-nextjoin__d${d <= 7 ? ' is-soon' : ''}`}>{d <= 0 ? 'Due now' : `in ${d}d`}</span>
                </button>
              ))}
              {upcomingJoiners.length > 6 && (
                <button className="ta-link hr-nextjoin__all" onClick={() => navigate('/hr/candidates?stage=onboarding')}>
                  View all {upcomingJoiners.length} upcoming joiners
                </button>
              )}
            </div>
          )}
        </Card>
      </div>

      <div className="ta-bento">
      <Card
        title="Onboarding Stage-wise Progress"
        action={<button className="ta-link" onClick={() => navigate('/hr/candidates?stage=onboarding')}>View details →</button>}
        bodyStyle={{ justifyContent: 'flex-start' }}
      >
        {accepted.length === 0 ? (
          <p className="ta-cell-mute">No candidates are in the onboarding journey yet.</p>
        ) : (
          <>
            <p className="ta-cell-sub" style={{ marginBottom: 14 }}>
              {accepted.length} candidate{accepted.length === 1 ? '' : 's'} in the onboarding journey · {journey[journey.length - 1].count} onboarded
            </p>
            <StageJourney stages={journey} />
            <div className="hr-insight">
              <span className="hr-insight__icon"><Icon name="Lightbulb" size={15} /></span>
              <span className="hr-insight__body">
                <strong>Key Insight</strong>
                <span>
                  {insightCount > 0
                    ? `${insightCount} candidate${insightCount === 1 ? ' is' : 's are'} currently pending document verification.`
                    : 'No candidates are stuck on document verification right now.'}
                </span>
              </span>
              <button className="ta-link" onClick={() => navigate('/hr/candidates?stage=verification')}>View details →</button>
            </div>
          </>
        )}
      </Card>

      <Card
        title="Onboarding by Department"
        action={<span className="ta-cell-sub">{notJoined.length} joining across {deptSlices.length} team{deptSlices.length === 1 ? '' : 's'}</span>}
      >
        {notJoined.length === 0 ? (
          <p className="ta-cell-mute">No one is currently in onboarding.</p>
        ) : (
          <DonutChart slices={deptSlices} caption="joining" onSliceClick={() => navigate('/hr/candidates?stage=onboarding')} />
        )}
      </Card>
      </div>
    </>
  );
}
