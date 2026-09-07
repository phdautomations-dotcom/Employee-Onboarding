import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/common/Icon.jsx';
import Button from '../components/common/Button.jsx';
import { useApp } from '../context/AppContext.jsx';
import { ROLES, ROLE_META } from '../constants/roles.js';

const OPTIONS = [
  { role: ROLES.CANDIDATE, icon: 'User' },
  { role: ROLES.TA, icon: 'Users' },
  { role: ROLES.HR, icon: 'UserRoundCheck' },
];

export default function LoginPage() {
  const { setRole } = useApp();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(ROLES.CANDIDATE);

  const proceed = () => {
    setRole(selected);
    navigate(ROLE_META[selected].home);
  };

  return (
    <div className="login-wrap">
      <div className="login-split">
        <aside className="login-brand">
          <div className="brand" style={{ color: '#fff' }}>
            <span className="brand__mark" style={{ background: 'rgba(255,255,255,.16)' }}>Cc</span>
            <span>Ccentrik</span>
          </div>
          <h2>Recruitment &amp; onboarding, from first application to first day.</h2>
          <p>One workspace for candidates, talent acquisition and HR — applications, interviews, documents, offers and onboarding.</p>
          <div className="login-brand__feats">
            <span><Icon name="CheckCircle2" size={14} /> Resume auto-fill</span>
            <span><Icon name="CheckCircle2" size={14} /> Multi-round interviews</span>
            <span><Icon name="CheckCircle2" size={14} /> Offer &amp; onboarding tracking</span>
          </div>
        </aside>

        <div className="login-card">
          <h1 className="page-title">Choose an experience</h1>
          <p className="text-secondary text-small mt-2 mb-4">
            A frontend role simulation — no password required.
          </p>
          <div className="stack gap-2">
            {OPTIONS.map((o) => (
              <button
                key={o.role}
                type="button"
                className={`role-option${selected === o.role ? ' role-option--active' : ''}`}
                onClick={() => setSelected(o.role)}
              >
                <span className="role-option__icon">
                  <Icon name={o.icon} size={18} />
                </span>
                <span className="stack" style={{ textAlign: 'left' }}>
                  <span className="strong text-small">{ROLE_META[o.role].label}</span>
                  <span className="text-xs text-secondary">{ROLE_META[o.role].description}</span>
                </span>
                <span className="grow" />
                {selected === o.role && <Icon name="CheckCircle2" size={16} style={{ color: 'var(--color-primary)' }} />}
              </button>
            ))}
          </div>
          <Button block className="mt-4" iconRight="ArrowRight" onClick={proceed}>
            Continue as {ROLE_META[selected].label}
          </Button>
        </div>
      </div>
    </div>
  );
}
