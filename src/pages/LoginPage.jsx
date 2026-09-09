import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/common/Icon.jsx';
import { useApp } from '../context/AppContext.jsx';
import { ROLES, ROLE_META } from '../constants/roles.js';
import logo from '../assets/ccentrik-logo.png';

const WORKSPACES = [
  {
    role: ROLES.TA,
    icon: 'Users',
    title: 'Talent Acquisition',
    blurb: 'Screen applicants, run interviews, verify documents and extend offers.',
  },
  {
    role: ROLES.HR,
    icon: 'UserRoundCheck',
    title: 'Human Resources',
    blurb: 'Take over accepted candidates, verify onboarding and complete joining.',
  },
];

const HIGHLIGHTS = [
  'One shared pipeline from application to first day',
  'Documents, offers and onboarding tracked in one place',
  'A live activity trail across every team',
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { setRole } = useApp();
  const [selected, setSelected] = useState(ROLES.TA);

  const enter = () => {
    setRole(selected);
    navigate(ROLE_META[selected].home);
  };

  return (
    <div className="auth">
      <aside className="auth__brand">
        <a className="auth__logo" href="/">
          <img src={logo} alt="Ccentrik" />
          <span>Ccentrik</span>
        </a>

        <div className="auth__pitch">
          <h1>One workspace for hiring and onboarding.</h1>
          <p>
            Ccentrik connects Talent Acquisition and HR on a single workflow —
            so nothing gets lost between the offer and the first day.
          </p>
          <ul className="auth__highlights">
            {HIGHLIGHTS.map((h) => (
              <li key={h}><Icon name="CheckCircle2" size={15} /> {h}</li>
            ))}
          </ul>
        </div>

        <p className="auth__copy">© {new Date().getFullYear()} Ccentrik · a frontend product demo</p>
      </aside>

      <main className="auth__panel">
        <a className="auth__back" href="/"><Icon name="ArrowLeft" size={14} /> Back to home</a>

        <div className="auth__form">
          <h2>Sign in</h2>
          <p className="auth__sub">
            Choose your workspace to continue. This is a role simulation — no password required.
          </p>

          <div className="auth__opts" role="radiogroup" aria-label="Workspace">
            {WORKSPACES.map((w) => {
              const active = selected === w.role;
              return (
                <button
                  key={w.role}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`auth__opt${active ? ' is-active' : ''}`}
                  onClick={() => setSelected(w.role)}
                >
                  <span className="auth__optIcon"><Icon name={w.icon} size={19} /></span>
                  <span className="auth__optText">
                    <strong>{w.title}</strong>
                    <span>{w.blurb}</span>
                  </span>
                  <Icon name={active ? 'CheckCircle2' : 'Circle'} size={18} className="auth__optMark" />
                </button>
              );
            })}
          </div>

          <button className="auth__go" onClick={enter}>
            Continue as {WORKSPACES.find((w) => w.role === selected).title}
            <Icon name="ArrowRight" size={16} />
          </button>

          <div className="auth__divider"><span>or</span></div>

          <a className="auth__careers" href="/candidate">
            <span className="auth__careersText">
              <strong>Applying for a role?</strong>
              <span>Browse jobs on the careers site — candidates don't sign in.</span>
            </span>
            <Icon name="ArrowRight" size={15} />
          </a>
        </div>
      </main>
    </div>
  );
}
