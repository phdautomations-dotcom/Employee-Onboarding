import { useNavigate } from 'react-router-dom';
import TAHeader from '../../components/ta/TAHeader.jsx';
import Card from '../../components/ta/Card.jsx';
import KpiCard from '../../components/ta/KpiCard.jsx';
import FunnelChart from '../../components/ta/FunnelChart.jsx';
import DonutChart from '../../components/ta/DonutChart.jsx';
import Avatar from '../../components/ta/Avatar.jsx';
import Tag from '../../components/ta/Tag.jsx';
import Icon from '../../components/common/Icon.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { DEMO_USERS, ROLES } from '../../constants/roles.js';
import { APP_STATUS, OFFER_STATUS, HR_FUNNEL_STAGES, hrStageRank } from '../../constants/statuses.js';
import { weeklyCounts } from '../../utils/metrics.js';
import { timeAgo } from '../../utils/format.js';

// Where every candidate HR has actually reviewed stands right now —
// HR's job starts once forms are submitted (Under Review) and ends once
// they're onboarded, so this only covers those stages.
const REVIEW_BUCKETS = [
  { status: APP_STATUS.HR_VERIFICATION, label: 'Under Review', color: 'var(--tag-amber-fg)' },
  { status: APP_STATUS.HR_VERIFICATION_REJECTED, label: 'Returned for Correction', color: 'var(--tag-red-fg)' },
  { status: APP_STATUS.JOINING_PENDING, label: 'Confirmed — Joining', color: 'var(--tag-teal-fg)' },
  { status: APP_STATUS.EMPLOYEE, label: 'Onboarded', color: 'var(--tag-green-fg)' },
];

export default function HRDashboard() {
  const navigate = useNavigate();
  const { data, offerFor, activitiesFor } = useApp();
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
      onClick: () => navigate(`/hr/offers?status=${OFFER_STATUS.ISSUED}`),
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

  // Candidates whose forms HR has actually reviewed (or is reviewing) —
  // where each one currently stands in that review.
  const reviewedCandidates = apps.filter((a) => REVIEW_BUCKETS.some((b) => b.status === a.status));
  const reviewSlices = REVIEW_BUCKETS.map((b) => ({
    label: b.label,
    color: b.color,
    value: apps.filter((a) => a.status === b.status).length,
  }));

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
                      <Avatar name={name} size="sm" />
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

        <Card title="Onboarding Pipeline">
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
      </div>

      {/* Onboarding Review Status — where the forms HR has reviewed (or is
          reviewing) currently stand, end to end from review to onboarded. */}
      <Card
        title="Onboarding Review Status"
        action={<button className="ta-link" onClick={() => navigate('/hr/candidates')}>View candidates <Icon name="ArrowRight" size={13} /></button>}
      >
        {reviewedCandidates.length === 0 ? (
          <p className="ta-cell-mute">Nothing reviewed yet — this fills in once candidates submit onboarding forms.</p>
        ) : (
          <DonutChart
            slices={reviewSlices}
            caption="Reviewed"
            onSliceClick={(label) => {
              const bucket = REVIEW_BUCKETS.find((b) => b.label === label);
              if (bucket) navigate(`/hr/candidates?status=${bucket.status}`);
            }}
          />
        )}
      </Card>
    </>
  );
}
