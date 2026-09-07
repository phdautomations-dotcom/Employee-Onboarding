import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon.jsx';
import TAHeader from '../../components/ta/TAHeader.jsx';
import Card from '../../components/ta/Card.jsx';
import KpiCard from '../../components/ta/KpiCard.jsx';
import DonutChart from '../../components/ta/DonutChart.jsx';
import FunnelChart from '../../components/ta/FunnelChart.jsx';
import DataGrid from '../../components/ta/DataGrid.jsx';
import Avatar from '../../components/ta/Avatar.jsx';
import Tag from '../../components/ta/Tag.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { DEMO_USERS, ROLES } from '../../constants/roles.js';
import {
  APP_STATUS,
  ROUND_STATUS,
  OFFER_STATUS,
  stageIndexForStatus,
  stageBadgeForStatus,
} from '../../constants/statuses.js';
import { countInWindow, trendPercent, weeklyCounts, groupCounts } from '../../utils/metrics.js';
import { formatDate } from '../../utils/format.js';

/* The five pipeline stages shown in the funnel + list, with the index in
   PIPELINE_STAGES a candidate must have reached to be counted. */
const STAGES = [
  { label: 'Applied', icon: 'FileText', tone: 'blue', reach: 0, color: '#4b7bf7' },
  { label: 'Screening', icon: 'Eye', tone: 'violet', reach: 1, color: '#8b7ff0' },
  { label: 'Interview', icon: 'CalendarDays', tone: 'amber', reach: 2, color: '#f6a04a' },
  { label: 'Offer', icon: 'FileCheck', tone: 'green', reach: 4, color: '#46c98a' },
  { label: 'Hired', icon: 'UserRoundCheck', tone: 'green', reach: 5, color: '#a5ddc2' },
];

const SOURCE_COLOR = {
  Direct: 'var(--viz-blue)',
  'Job Board': 'var(--viz-orange)',
  Referral: 'var(--viz-aqua)',
  Social: 'var(--viz-magenta)',
};

const PERIODS = [
  { value: 'all', label: 'All time', days: null },
  { value: '90', label: 'Last 90 days', days: 90 },
  { value: '30', label: 'Last 30 days', days: 30 },
];

function experienceLabel(years) {
  const n = Number(years) || 0;
  return n <= 0 ? 'Fresher' : `${n}+ Years`;
}

export default function TADashboard() {
  const navigate = useNavigate();
  const { data, jobs, getJob } = useApp();
  const user = DEMO_USERS[ROLES.TA];
  const [period, setPeriod] = useState('all');

  const apps = data.applications || [];
  const interviews = data.interviews || [];
  const offers = data.offers || [];

  /* Applications inside the selected period (used by the pipeline + donut). */
  const periodApps = useMemo(() => {
    const days = PERIODS.find((p) => p.value === period)?.days;
    if (!days) return apps;
    const cutoff = Date.now() - days * 86400000;
    return apps.filter((a) => new Date(a.submittedAt).getTime() >= cutoff);
  }, [apps, period]);

  const kpis = useMemo(() => {
    const extendedOffers = offers.filter((o) =>
      [OFFER_STATUS.ISSUED, OFFER_STATUS.ACCEPTED, OFFER_STATUS.DECLINED].includes(o.status)
    );
    const jobsWithApplicants = jobs.filter((j) => apps.some((a) => a.jobId === j.id)).length;
    const interviewsDone = interviews.filter((i) => i.status !== ROUND_STATUS.SCHEDULED).length;
    const offersAccepted = offers.filter((o) => o.status === OFFER_STATUS.ACCEPTED).length;
    return [
      {
        icon: 'Users', label: 'Total Candidates', accent: 'blue', value: apps.length,
        trend: trendPercent(countInWindow(apps, 'submittedAt', 0), countInWindow(apps, 'submittedAt', 1)),
        note: 'Since the first application',
        spark: weeklyCounts(apps, 'submittedAt', 8),
        onClick: () => navigate('/ta/candidates'),
      },
      {
        icon: 'Briefcase', label: 'Open Jobs', accent: 'violet', value: jobs.length,
        note: `${jobsWithApplicants} receiving applicants`,
        onClick: () => navigate('/ta/jobs'),
      },
      {
        icon: 'CalendarDays', label: 'Interviews Scheduled', accent: 'amber',
        value: interviews.filter((i) => i.status === ROUND_STATUS.SCHEDULED).length,
        trend: trendPercent(countInWindow(interviews, 'date', 0), countInWindow(interviews, 'date', 1)),
        note: `${interviewsDone} completed so far`,
        spark: weeklyCounts(interviews, 'date', 8),
      },
      {
        icon: 'FileCheck', label: 'Offers Extended', accent: 'green', value: extendedOffers.length,
        trend: trendPercent(countInWindow(extendedOffers, 'createdAt', 0), countInWindow(extendedOffers, 'createdAt', 1)),
        note: `${offersAccepted} accepted`,
        spark: weeklyCounts(extendedOffers, 'createdAt', 8),
      },
    ];
  }, [apps, jobs, interviews, offers, navigate]);

  const stageRows = useMemo(() => {
    const active = periodApps.filter((a) => a.status !== APP_STATUS.REJECTED);
    return STAGES.map((s) => ({
      ...s,
      value: active.filter((a) => stageIndexForStatus(a.status) >= s.reach).length,
    }));
  }, [periodApps]);
  const busiest = stageRows.reduce((top, s) => (s.value > top.value ? s : top), stageRows[0]);

  const sourceSlices = useMemo(() => {
    const counts = groupCounts(periodApps, (a) => a.source || 'Direct');
    return counts.map((c) => ({ label: c.key, value: c.count, color: SOURCE_COLOR[c.key] || 'var(--viz-magenta)' }));
  }, [periodApps]);

  const latest = useMemo(
    () => [...apps].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)).slice(0, 6),
    [apps]
  );

  const columns = [
    { key: 'candidate', label: 'Candidate' },
    { key: 'job', label: 'Job Applied' },
    { key: 'experience', label: 'Experience' },
    { key: 'stage', label: 'Current Stage' },
    { key: 'applied', label: 'Applied On' },
    { key: 'actions', label: 'Actions' },
  ];

  const periodSelect = (
    <select className="ta-period" value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Time period">
      {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
    </select>
  );

  return (
    <>
      <TAHeader title="Dashboard" subtitle={`Welcome back, ${user.name}`} />

      <div className="ta-kpi-row">
        {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>

      <div className="ta-bento">
        <Card title="Candidates Pipeline" action={periodSelect}>
          <div className="ta-pipe-wrap">
            <div className="ta-pipe">
              {stageRows.map((s) => (
                <button
                  key={s.label}
                  className={`ta-pipe__row${s.label === busiest.label ? ' ta-pipe__row--active' : ''}`}
                  onClick={() => navigate('/ta/candidates')}
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
            <FunnelChart stages={stageRows} />
          </div>
        </Card>

        <Card title="Applications Overview" action={periodSelect}>
          {sourceSlices.length === 0 ? (
            <p className="ta-cell-mute">No applications in this period.</p>
          ) : (
            <DonutChart slices={sourceSlices} caption="Total" />
          )}
        </Card>
      </div>

      <DataGrid
        title="Latest Candidates"
        action={<button className="ta-link" onClick={() => navigate('/ta/candidates')}>View all <Icon name="ArrowRight" size={13} /></button>}
        columns={columns}
        rows={latest}
        empty={{ icon: 'Users', title: 'No candidates yet', message: 'Candidates appear here as applications come in.' }}
        renderRow={(a) => {
          const name = `${a.personal.firstName} ${a.personal.lastName}`;
          const job = getJob(a.jobId);
          const badge = stageBadgeForStatus(a.status);
          return (
            <tr key={a.id} onClick={() => navigate(`/ta/candidates/${a.candidateId}`)} style={{ cursor: 'pointer' }}>
              <td>
                <span className="ta-cell-cand">
                  <Avatar name={name} />
                  <span>
                    <span className="ta-cell-cand__name">{name}</span><br />
                    <span className="ta-cell-cand__sub">{a.personal.email}</span>
                  </span>
                </span>
              </td>
              <td>
                <span className="ta-cell-strong">{a.jobTitle}</span><br />
                <span className="ta-cell-sub">{job?.department || 'General'}</span>
              </td>
              <td className="ta-cell-mute">{experienceLabel(a.professional.totalExperience)}</td>
              <td><Tag tone={badge.tone}>{badge.label}</Tag></td>
              <td className="ta-cell-mute">{formatDate(a.submittedAt)}</td>
              <td>
                <span className="ta-rowactions" onClick={(e) => e.stopPropagation()}>
                  <a className="ta-iconbtn" href={`mailto:${a.personal.email}`} aria-label={`Email ${name}`}>
                    <Icon name="Mail" size={15} />
                  </a>
                  <button className="ta-iconbtn" onClick={() => navigate(`/ta/candidates/${a.candidateId}`)} aria-label="Open candidate">
                    <Icon name="ArrowRight" size={15} />
                  </button>
                </span>
              </td>
            </tr>
          );
        }}
      />
    </>
  );
}
