import Icon from '../common/Icon.jsx';
import ProgressRing from '../common/ProgressRing.jsx';
import { APP_STATUS, DOC_STATUS, OFFER_STATUS } from '../../constants/statuses.js';

export default function OnboardingJourney({ application, documents = [], offer, employee }) {
  const isEmployee = application.status === APP_STATUS.EMPLOYEE;
  const req = documents.filter((d) => d.required);
  const verified = req.filter((d) => d.status === DOC_STATUS.VERIFIED).length;
  const docPct = req.length ? Math.round((verified / req.length) * 100) : 0;

  const stages = [
    { icon: 'CheckCircle2', title: 'Offer accepted', pct: offer?.status === OFFER_STATUS.ACCEPTED || isEmployee ? 100 : 0 },
    { icon: 'Files', title: 'Documents verified', pct: docPct },
    { icon: 'UserRoundCheck', title: 'Employee record created', pct: employee ? 100 : 0 },
    { icon: 'CalendarCheck', title: 'Joining confirmed', pct: isEmployee ? 100 : 0 },
    { icon: 'Rocket', title: 'IT & equipment', pct: isEmployee ? 100 : 0 },
    { icon: 'GraduationCap', title: 'Orientation', pct: isEmployee ? 100 : 0 },
  ];
  const overall = Math.round(stages.reduce((a, s) => a + s.pct, 0) / stages.length);

  return (
    <div>
      <div className="row gap-4 mb-4">
        <ProgressRing value={overall} size={60} />
        <div>
          <div className="section-title">{overall}% complete</div>
          <div className="text-xs text-secondary">
            {isEmployee ? 'Onboarding complete — employee is active.' : 'Onboarding in progress.'}
          </div>
        </div>
      </div>
      <div className="ojourney">
        {stages.map((s) => {
          const state = s.pct >= 100 ? 'done' : s.pct > 0 ? 'current' : 'pending';
          return (
            <div key={s.title} className={`oj oj--${state}`}>
              <span className="oj__node">
                <Icon name={state === 'done' ? 'Check' : s.icon} size={14} />
              </span>
              <div className="oj__body">
                <div className="oj__title">{s.title}</div>
                <div className="oj__bar"><div style={{ width: `${s.pct}%` }} /></div>
              </div>
              <span className="oj__pct">{s.pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
