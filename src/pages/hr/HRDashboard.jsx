import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/common/Card.jsx';
import Metric from '../../components/common/Metric.jsx';
import PipelineFunnel from '../../components/common/PipelineFunnel.jsx';
import { Identity } from '../../components/common/Avatar.jsx';
import Button from '../../components/common/Button.jsx';
import Icon from '../../components/common/Icon.jsx';
import { ActivityTimeline } from '../../components/common/Timeline.jsx';
import { EmptyState } from '../../components/common/States.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { APP_STATUS, OFFER_STATUS } from '../../constants/statuses.js';
import { formatDate, formatCurrencyINR } from '../../utils/format.js';

export default function HRDashboard() {
  const { data, getApplication } = useApp();
  const navigate = useNavigate();
  const apps = data.applications || [];
  const offers = data.offers || [];
  const count = (fn, arr = apps) => arr.filter(fn).length;

  const pendingOffers = offers.filter((o) => o.status === OFFER_STATUS.PENDING_APPROVAL);

  const metrics = [
    { label: 'Pending Approvals', value: pendingOffers.length, tone: pendingOffers.length ? 'amber' : undefined, to: `/hr/offers?status=${OFFER_STATUS.PENDING_APPROVAL}` },
    { label: 'Offers Issued', value: count((a) => a.status === APP_STATUS.OFFER_ISSUED), tone: 'indigo', to: `/hr/offers?status=${OFFER_STATUS.ISSUED}` },
    { label: 'Joining Soon', value: count((a) => a.status === APP_STATUS.JOINING_PENDING), tone: 'amber', to: '/hr/employees' },
    { label: 'Employees Onboarded', value: (data.employees || []).length, tone: 'teal', to: '/hr/employees' },
  ];

  const funnel = useMemo(
    () => [
      { label: 'Ready for offer', value: count((a) => a.status === APP_STATUS.DOCS_VERIFIED) },
      { label: 'Pending approval', value: pendingOffers.length },
      { label: 'Offer issued', value: count((a) => a.status === APP_STATUS.OFFER_ISSUED) },
      { label: 'Accepted', value: offers.filter((o) => o.status === OFFER_STATUS.ACCEPTED).length },
      { label: 'Joining', value: count((a) => a.status === APP_STATUS.JOINING_PENDING) },
      { label: 'Onboarded', value: (data.employees || []).length, muted: true },
    ],
    [apps, offers, data.employees]
  );

  return (
    <div className="page-body">
      <div className="dash-head">
        <h1>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, Arjun</h1>
        <p>Approvals, offers and onboarding across Talent Blooming.</p>
      </div>

      <div className="metric-grid mb-6">
        {metrics.map((m) => (
          <Metric key={m.label} label={m.label} value={m.value} tone={m.tone} onClick={() => navigate(m.to)} />
        ))}
      </div>

      <div className="dash-grid">
        <div className="stack gap-4">
          <Card
            title="Needs your approval"
            actions={<Button variant="ghost" size="sm" iconRight="ArrowRight" onClick={() => navigate('/hr/offers')}>All offers</Button>}
          >
            {pendingOffers.length === 0 ? (
              <EmptyState icon="CheckCircle2" title="No offers pending" message="Every offer has been actioned." />
            ) : (
              pendingOffers.map((o) => {
                const app = getApplication(o.applicationId);
                return (
                  <button
                    key={o.id}
                    className="attn-item"
                    style={{ '--a': 'var(--tf-indigo)' }}
                    onClick={() => app && navigate(`/hr/candidates/${app.candidateId}`)}
                  >
                    <span className="attn-item__dot"><Icon name="FileCheck" size={16} /></span>
                    <span className="attn-item__body">
                      <span className="attn-item__title">Offer for {o.candidateName}</span>
                      <span className="attn-item__meta">
                        {o.jobTitle} · {formatCurrencyINR(o.compensation)} · joins {formatDate(o.joiningDate)}
                      </span>
                    </span>
                    <span className="badge badge--warning">Review</span>
                  </button>
                );
              })
            )}
          </Card>

          <Card title="Onboarding pipeline">
            <PipelineFunnel stages={funnel} />
          </Card>
        </div>

        <div className="stack gap-4">
          <Card title="Recent activity">
            <ActivityTimeline items={(data.activities || []).slice(0, 7)} />
          </Card>
        </div>
      </div>
    </div>
  );
}
