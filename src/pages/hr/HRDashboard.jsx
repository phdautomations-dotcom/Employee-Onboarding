import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TAHeader from '../../components/ta/TAHeader.jsx';
import Card from '../../components/ta/Card.jsx';
import KpiCard from '../../components/ta/KpiCard.jsx';
import DonutChart from '../../components/ta/DonutChart.jsx';
import Funnel from '../../components/ta/Funnel.jsx';
import Tag from '../../components/ta/Tag.jsx';
import Icon from '../../components/common/Icon.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { DEMO_USERS, ROLES } from '../../constants/roles.js';
import { APP_STATUS, DOC_STATUS, hrStageRank } from '../../constants/statuses.js';
import { timeAgo, formatDate } from '../../utils/format.js';

const HANDOVER_PREVIEW = 3;

export default function HRDashboard() {
  const navigate = useNavigate();
  const { data, offerFor, documentsFor, activitiesFor } = useApp();
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
  // ===== The onboarding funnel now lives in the KPI tiles — cumulative counts,
  // each tile's meter is its share of everyone who accepted, and clicking opens
  // the matching Stage filter on the candidates page. =====
  const accepted = apps.filter((a) => hrStageRank(a.status) >= 2);
  const reached = (rank) => accepted.filter((a) => hrStageRank(a.status) >= rank).length;
  const total = accepted.length || 1;
  const submittedDocs = accepted.filter((a) => a.onboarding).length;
  const verified = reached(4);
  const onboarded = reached(5);

  const kpis = [
    {
      icon: 'FileCheck', label: 'Offer Accepted', accent: 'violet', value: total,
      meter: { value: total, max: total },
      note: 'accepted · now in HR onboarding',
      onClick: () => navigate('/hr/candidates?stage=onboarding'),
    },
    {
      icon: 'Files', label: 'Joining Documents', accent: 'blue', value: submittedDocs,
      meter: { value: submittedDocs, max: total },
      note: `${total - submittedDocs} still to submit`,
      onClick: () => navigate('/hr/candidates?stage=verification'),
    },
    {
      icon: 'CheckCircle2', label: 'Documents Verified', accent: 'teal', value: verified,
      meter: { value: verified, max: total },
      note: `${pendingVerification.length} awaiting your review`,
      onClick: () => navigate('/hr/candidates?stage=joining'),
    },
    {
      icon: 'UserRoundCheck', label: 'Onboarded', accent: 'green', value: onboarded,
      meter: { value: onboarded, max: total },
      note: `${joiningPending} joining soon${joinedThisMonth > 0 ? ` · ${joinedThisMonth} this month` : ''}`,
      onClick: () => navigate('/hr/employees'),
    },
  ];

  // ===== Document Verification funnel — the joining-document journey for every
  // candidate HR currently owns: submitted → all verified. =====
  const inHrPipe = accepted.filter((a) => a.status !== APP_STATUS.EMPLOYEE);
  let docsSubmitted = 0;
  let docsAllVerified = 0;
  inHrPipe.forEach((a) => {
    const docs = documentsFor(a.id).filter((d) => d.required);
    if (!docs.length) return;
    if (docs.every((d) => d.status !== DOC_STATUS.PENDING)) docsSubmitted += 1;
    if (docs.every((d) => d.status === DOC_STATUS.VERIFIED)) docsAllVerified += 1;
  });
  const docFunnel = [
    { label: 'In onboarding', tone: 'violet', value: inHrPipe.length, onClick: () => navigate('/hr/candidates?stage=onboarding') },
    { label: 'Documents submitted', tone: 'blue', value: docsSubmitted, onClick: () => navigate('/hr/candidates?stage=verification') },
    { label: 'All verified', tone: 'green', value: docsAllVerified, onClick: () => navigate('/hr/candidates?stage=joining') },
  ];

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

  // ===== Onboarding by Department — which teams the incoming hires are joining,
  // so HR can line up equipment, access and inductions per team. =====
  const deptCounts = {};
  notJoined.forEach((a) => {
    const dept = offerFor(a.id)?.department || 'Unassigned';
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  });
  const DEPT_RAMP = ['#4b7bf7', '#8b7ff0', '#f6a04a', '#46c98a', '#3fbfae', '#f2b705'];
  let deptSlices = Object.entries(deptCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], i) => ({ label, value, color: DEPT_RAMP[i % DEPT_RAMP.length] }));
  if (deptSlices.length > 5) {
    const rest = deptSlices.slice(4).reduce((s, x) => s + x.value, 0);
    deptSlices = [...deptSlices.slice(0, 4), { label: 'Other', value: rest, color: '#98a2b3' }];
  }

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
          title="Document Verification"
          action={<span className="ta-cell-sub">{docsAllVerified} of {inHrPipe.length} fully verified</span>}
        >
          {inHrPipe.length === 0 ? (
            <p className="ta-cell-mute">No one is currently in onboarding.</p>
          ) : (
            <Funnel stages={docFunnel} />
          )}
        </Card>

        <Card
          title="Onboarding by Department"
          action={<span className="ta-cell-sub">{notJoined.length} joining across {Object.keys(deptCounts).length} team{Object.keys(deptCounts).length === 1 ? '' : 's'}</span>}
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
