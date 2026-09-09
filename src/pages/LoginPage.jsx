import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/common/Icon.jsx';
import { useApp } from '../context/AppContext.jsx';
import { ROLES, ROLE_META } from '../constants/roles.js';
import mark from '../assets/centrik-logo-white.png';

const DOMAIN = '@ccentrik.com';

const JOURNEY = [
  { label: 'Application', icon: 'FileText' },
  { label: 'Screening', icon: 'Eye' },
  { label: 'Interview', icon: 'CalendarDays' },
  { label: 'Offer', icon: 'FileCheck' },
  { label: 'Onboarding', icon: 'ClipboardCheck' },
  { label: 'Active employee', icon: 'UserRoundCheck' },
];

/* No backend — infer the internal role from the username so the customer isn't
   asked to pick one. Routing / guards / session are unchanged. */
function roleFromUser(username) {
  const u = username.toLowerCase();
  if (/(^|[._-])(ta|talent|recruit)/.test(u)) return ROLES.TA;
  return ROLES.HR;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { setRole } = useApp();

  const [username, setUsername] = useState('hr');
  const [password, setPassword] = useState('ccentrik');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const signIn = (role) => {
    setLoading(true);
    setTimeout(() => {
      setRole(role);
      navigate(ROLE_META[role].home);
    }, 700);
  };

  const submit = (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    if (!username.trim()) { setError('Enter your username.'); return; }
    if (!password) { setError('Enter your password.'); return; }
    signIn(roleFromUser(username.trim()));
  };

  return (
    <div className="wsauth">
      <aside className="wsauth__aside">
        <img className="wsauth__logo wsauth__logo--lg" src={mark} alt="Ccentrik" />

        <div className="wsauth__pitch">
          <h1>From applicant to employee,<br /><span>one continuous workspace.</span></h1>
          <p>Talent Acquisition, HR and every team member — working the same journey, end to end.</p>
        </div>

        <ol className="wsjourney" aria-hidden="true">
          <span className="wsjourney__rail"><span className="wsjourney__pulse" /></span>
          {JOURNEY.map((s, i) => (
            <li className="wsjourney__step" key={s.label} style={{ '--i': i }}>
              <span className="wsjourney__node"><Icon name={s.icon} size={14} /></span>
              <span className="wsjourney__label">{s.label}</span>
            </li>
          ))}
        </ol>
      </aside>

      <main className="wsauth__main">
        <form className="wsauth__panel" onSubmit={submit} noValidate>
          <img className="wsauth__logo wsauth__logo--sm" src={mark} alt="Ccentrik" />
          <h2>Welcome back</h2>
          <p className="wsauth__lede">Log in to Ccentrik Workspace</p>

          {error && (
            <div className="wsauth__alert" role="alert">
              <Icon name="AlertCircle" size={15} /> {error}
            </div>
          )}

          <label className="wsauth__field">
            <span className="wsauth__label">Username</span>
            <span className="wsauth__box">
              <input
                type="text"
                autoComplete="username"
                placeholder="yourname"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                aria-label="Username"
              />
              <span className="wsauth__suffix">{DOMAIN}</span>
            </span>
          </label>

          <label className="wsauth__field">
            <span className="wsauth__label">Password</span>
            <span className="wsauth__box">
              <input
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-label="Password"
              />
              <button
                type="button"
                className="wsauth__eye"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                <Icon name={showPw ? 'EyeOff' : 'Eye'} size={16} />
              </button>
            </span>
          </label>

          <button
            type="button"
            className="wsauth__forgot"
            onClick={() => setError('Password resets are handled by your workspace administrator.')}
          >
            Forgot password?
          </button>

          <button type="submit" className="wsauth__submit" disabled={loading}>
            {loading ? <><span className="wsauth__spinner" /> Signing in…</> : <>Sign in <Icon name="ArrowRight" size={16} /></>}
          </button>

          <div className="wsauth__or"><span>or</span></div>

          <button type="button" className="wsauth__google" onClick={() => !loading && signIn(ROLES.HR)} disabled={loading}>
            <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
              <path fill="#FBBC05" d="M5.85 14.1a6.6 6.6 0 0 1 0-4.22V7.04H2.18a11 11 0 0 0 0 9.9l3.67-2.84Z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.67 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
            </svg>
            Sign in with Google
          </button>

          <p className="wsauth__foot">For internal use by the <b>Ccentrik</b> team.</p>
        </form>
      </main>
    </div>
  );
}
