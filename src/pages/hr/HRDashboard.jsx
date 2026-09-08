import { useNavigate } from 'react-router-dom';
import TAHeader from '../../components/ta/TAHeader.jsx';
import Card from '../../components/ta/Card.jsx';
import KpiCard from '../../components/ta/KpiCard.jsx';
import FunnelChart from '../../components/ta/FunnelChart.jsx';
import DonutChart from '../../components/ta/DonutChart.jsx';
import Tag from '../../components/ta/Tag.jsx';
import Icon from '../../components/common/Icon.jsx';
import { ActivityTimeline } from '../../components/common/Timeline.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { DEMO_USERS, ROLES } from '../../constants/roles.js';
import { APP_STATUS, OFFER_STATUS, HR_FUNNEL_STAGES, hrStageRank } from '../../constants/statuses.js';
import { weeklyCounts } from '../../utils/metrics.js';
import { timeAgo, formatDate } from '../../utils/format.js';

export default function HRDashboard() {
  const navigate = useNavigate();
  const { data, offerFor, activitiesFor, getApplication } = useApp();
  const user = DEMO_USERS[ROLES.HR];

  // ----- DATA -----
  const apps = data.applications || [];
  const offers = data.offers || [];
  const employees = data.employees || [];

  // ----- FILTERING -----
  const pendingVerification = apps.filter((a) => a.status === APP_STATUS.HR_VERIFICATION);

  // ----- CALCULATIONS -----
  const issuedOffers = offers.filter((o) => o.status === OFFER_STATUS.ISSUED);
  const acceptedOffers = offers.filter((o) => o.status === OFFER_STATUS.ACCEPTED);

  const kpis = [
    {
      icon: 'Eye', label: 'Onboarding Verification', accent: 'amber', value: pendingVerification.length,
      note: 'Needs your review',
      spark: weeklyCounts(acceptedOffers, 'decisionAt', 8),
      onClick: () => navigate('/hr/candidates?stage=verification'),
    },
    {
      icon: 'FileCheck', label: 'Offers Issued', accent: 'blue', value: apps.filter((a) => a.status === APP_STATUS.OFFER_ISSUED).length,
      note: 'Waiting on candidate',
      spark: weeklyCounts(issuedOffers, 'issuedAt', 8),
      onClick: () => navigate(`/hr/candidates?offer=${OFFER_STATUS.ISSUED}`),
    },
    {
      icon: 'CalendarClock', label: 'Joining Soon', accent: 'violet', value: apps.filter((a) => a.status === APP_STATUS.JOINING_PENDING).length,
      note: 'Ready to onboard',
      spark: weeklyCounts(acceptedOffers, 'decisionAt', 8),
      onClick: () => navigate('/hr/employees'),
    },
    {
      icon: 'UserRoundCheck', label: 'Employees Onboarded', accent: 'green', value: employees.length,
      note: 'All time',
      spark: weeklyCounts(employees, 'createdAt', 8),
      onClick: () => navigate('/hr/employees'),
    },
  ];

  // ----- CHART DATA -----
  // Each stage counts everyone who reached it or further, so the funnel only
  // ever narrows (a later stage can't have more people than an earlier one) —
  // same buckets the candidates table's stage filter uses, so clicking a stage
  // here shows exactly the candidates counted in it.
  const funnelStages = HR_FUNNEL_STAGES.map((s) => ({
    ...s,
    value: apps.filter((a) => hrStageRank(a.status) >= s.rank).length,
  }));
  const busiest = funnelStages.reduce((top, s) => (s.value > top.value ? s : top), funnelStages[0]);
  const reachedHR = funnelStages[0]?.value || 0;
  const onboardedCount = funnelStages[funnelStages.length - 1]?.value || 0;
  const convRate = reachedHR ? Math.round((onboardedCount / reachedHR) * 100) : 0;

  // Exclusive count per stage (each candidate sits in exactly one) — for the donut.
  const STAGE_COLOR = {
    reached_hr: '#4b7bf7', offer_sent: '#8b7ff0', onboarding: '#f6a04a',
    verification: '#f2b705', joining: '#3fbfae', onboarded: '#46c98a',
  };
  const stageSlices = HR_FUNNEL_STAGES.map((s) => ({
    label: s.label,
    value: apps.filter((a) => hrStageRank(a.status) === s.rank).length,
    color: STAGE_COLOR[s.key],
  }));

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
        <Card title="Onboarding Funnel">
          <div className="ta-pipe-wrap">
            <div className="ta-pipe">
              {funnelStages.map((s) => (
                <button
                  key={s.key}
                  className={`ta-pipe__row${s.key === busiest.key ? ' ta-pipe__row--active' : ''}`}
                  onClick={() => navigate(`/hr/candidates?stage=${s.key}`)}
                >
                  <span
                    className="ta-pipe__icon"
                    style={{ '--p-bg': `var(--tag-${s.tone}-bg)`, '--p-fg': `var(--tag-${s.tone}-fg)` }}
                  >
                    <Icon name={s.icon} size={15} />
                  </span>
                  <span className="ta-pipe__label">{s.label}</span>
                  <span className="ta-pipe__count">{s.value}</span>
                </button>
              ))}
            </div>
            <FunnelChart stages={funnelStages} />
          </div>
        </Card>

        <Card title="Where Candidates Are">
          <DonutChart
            slices={stageSlices}
            caption="In pipeline"
            onSliceClick={(label) => {
              const s = HR_FUNNEL_STAGES.find((x) => x.label === label);
              if (s) navigate(`/hr/candidates?stage=${s.key}`);
            }}
          />
          <div className="ta-note" style={{ margin: '12px 0 0', background: 'var(--ta-blue-wash)', color: 'var(--ta-text)' }}>
            <Icon name="TrendingUp" size={15} />
            <span><strong>{convRate}% onboarding conversion</strong> — {onboardedCount} of {reachedHR} who reached HR have joined.</span>
          </div>
        </Card>
      </div>

      <Card
        title="Recent Activity"
        action={<button className="ta-link" onClick={() => navigate('/hr/candidates')}>All candidates</button>}
      >
        <ActivityTimeline
          items={(data.activities || []).slice(0, 8)}
          onSelect={(it) => {
            const app = getApplication(it.applicationId);
            navigate(app ? `/hr/candidates/${app.candidateId}` : '/hr/candidates');
          }}
        />
      </Card>
    </>
  );
}
