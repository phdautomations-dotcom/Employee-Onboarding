import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/common/Icon.jsx';
import { useApp } from '../context/AppContext.jsx';
import { ROLES, ROLE_META } from '../constants/roles.js';
import logo from '../assets/ccentrik-logo.png';

const OPTIONS = [
  { role: ROLES.TA, icon: 'Users', blurb: 'Applications, interviews, documents and offers.' },
  { role: ROLES.HR, icon: 'UserRoundCheck', blurb: 'Onboarding verification, joining and employees.' },
];

export default function LoginPage() {
  const { setRole } = useApp();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(ROLES.TA);

  const proceed = () => {
    setRole(selected);
    navigate(ROLE_META[selected].home);
  };

  return (
    <div className="lp-login">
      <div className="lp-login__card">
        <a className="lp-login__back" href="/"><Icon name="ArrowLeft" size={14} /> Back to home</a>

        <span className="lp-login__brand">
          <img src={logo} alt="Ccentrik" />
          <span>Ccentrik</span>
        </span>

        <h1>Sign in to your workspace</h1>
        <p className="lp-login__sub">Pick a workspace to continue — this is a role simulation, no password needed.</p>

        <div className="lp-login__opts">
          {OPTIONS.map((o) => (
            <button
              key={o.role}
              type="button"
              className={`lp-login__opt${selected === o.role ? ' is-active' : ''}`}
              onClick={() => setSelected(o.role)}
            >
              <span className="lp-login__opticon"><Icon name={o.icon} size={18} /></span>
              <span className="lp-login__opttext">
                <strong>{ROLE_META[o.role].label}</strong>
                <span>{o.blurb}</span>
              </span>
              {selected === o.role && <Icon name="CheckCircle2" size={17} />}
            </button>
          ))}
        </div>

        <button className="lp-btn lp-btn--lg lp-login__go" onClick={proceed}>
          Continue as {ROLE_META[selected].label} <Icon name="ArrowRight" size={15} />
        </button>

        <p className="lp-login__note">
          Applying for a role? <a href="/candidate">Browse jobs on the careers site</a> — candidates don't sign in.
        </p>
      </div>
    </div>
  );
}
