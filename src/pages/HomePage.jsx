import { useNavigate } from 'react-router-dom';
import Icon from '../components/common/Icon.jsx';
import { useApp } from '../context/AppContext.jsx';
import { ROLES, ROLE_META } from '../constants/roles.js';
import logo from '../assets/ccentrik-logo.png';

const FLOW = [
  { icon: 'FileText', label: 'Apply', tone: 'blue' },
  { icon: 'Eye', label: 'Screen', tone: 'violet' },
  { icon: 'CalendarDays', label: 'Interview', tone: 'violet' },
  { icon: 'Files', label: 'Documents', tone: 'teal' },
  { icon: 'FileCheck', label: 'Offer', tone: 'amber' },
  { icon: 'ClipboardCheck', label: 'Onboard', tone: 'green' },
  { icon: 'UserRoundCheck', label: 'Employee', tone: 'green' },
];

const FEATURES = [
  { icon: 'UploadCloud', title: 'Resume auto-fill', body: 'Candidates upload a CV and the application fills itself — name, experience, skills and more.' },
  { icon: 'CalendarClock', title: 'Multi-round interviews', body: 'Schedule rounds, record results, and choose which remarks the candidate actually sees.' },
  { icon: 'BadgeCheck', title: 'Document verification', body: 'Mandatory documents are enforced; anything optional can be waived with a written reason.' },
  { icon: 'Route', title: 'Offer & onboarding tracking', body: 'From an emailed offer to a created employee record — every step stays visible.' },
  { icon: 'LayoutDashboard', title: 'Role-based dashboards', body: 'Candidate, Talent Acquisition and HR each get a focused, uncluttered workspace.' },
  { icon: 'Activity', title: 'Live activity feed', body: 'Every action is logged, and TA sees candidate-driven updates the moment they happen.' },
];

const ROLE_CARDS = [
  { role: ROLES.CANDIDATE, icon: 'User', blurb: 'Browse roles, apply with a resume, upload documents and track your offer through to day one.' },
  { role: ROLES.TA, icon: 'Users', blurb: 'Review applications, run interviews, verify documents and extend offers — all from one pipeline.' },
  { role: ROLES.HR, icon: 'UserRoundCheck', blurb: 'Pick up accepted candidates, verify onboarding details and complete joining to create the employee.' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { setRole } = useApp();

  const enter = (role) => { setRole(role); navigate(ROLE_META[role].home); };
  const watchDemo = () => {
    try { localStorage.setItem('talentflow.demo.autostart', '1'); } catch { /* ignore */ }
    setRole(ROLES.CANDIDATE);
    navigate('/candidate');
  };

  return (
    <div className="lp">
      <header className="lp-nav">
        <a className="lp-brand" href="/">
          <img src={logo} alt="Ccentrik" />
          <span>Ccentrik</span>
        </a>
        <nav className="lp-nav__links">
          <a href="#flow">How it works</a>
          <a href="#features">Features</a>
          <a href="#roles">Workspaces</a>
        </nav>
        <button className="lp-btn lp-btn--sm" onClick={() => enter(ROLES.CANDIDATE)}>
          Open the app <Icon name="ArrowRight" size={14} />
        </button>
      </header>

      <section className="lp-hero">
        <span className="lp-eyebrow">Recruitment &amp; Onboarding Platform</span>
        <h1>From first application<br />to first day — in one place.</h1>
        <p>
          Ccentrik connects candidates, talent acquisition and HR on a single workflow:
          applications, interviews, document checks, offers and onboarding, with a live
          trail of everything that happens.
        </p>
        <div className="lp-hero__cta">
          <button className="lp-btn lp-btn--lg" onClick={() => enter(ROLES.CANDIDATE)}>
            Explore the app <Icon name="ArrowRight" size={15} />
          </button>
          <button className="lp-btn lp-btn--ghost lp-btn--lg" onClick={watchDemo}>
            <Icon name="Play" size={14} /> Watch the demo run
          </button>
        </div>
        <div className="lp-hero__note">
          <Icon name="Bot" size={13} /> No sign-up — switch between Candidate, TA and HR views anytime.
        </div>
      </section>

      <section className="lp-window" id="flow">
        <div className="lp-window__bar">
          <span /><span /><span />
          <span className="lp-window__url">ccentrik.app / lifecycle</span>
        </div>
        <div className="lp-window__body">
          <p className="lp-window__title">The candidate lifecycle</p>
          <div className="lp-flow">
            {FLOW.map((s, i) => (
              <div className="lp-flow__step" key={s.label}>
                {i > 0 && <span className="lp-flow__arrow" aria-hidden="true"><Icon name="ChevronRight" size={15} /></span>}
                <span
                  className="lp-flow__node"
                  style={{ '--f-fg': `var(--tag-${s.tone}-fg)`, '--f-bg': `var(--tag-${s.tone}-bg)` }}
                >
                  <span className="lp-flow__icon"><Icon name={s.icon} size={16} /></span>
                  <span className="lp-flow__label">{s.label}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="lp-lanes">
            <span><i className="lp-dot lp-dot--blue" /> Candidate</span>
            <span><i className="lp-dot lp-dot--violet" /> Talent Acquisition</span>
            <span><i className="lp-dot lp-dot--green" /> HR</span>
          </div>
        </div>
      </section>

      <section className="lp-features" id="features">
        <h2>Everything the hand-off needs</h2>
        <p className="lp-section__sub">Built so nothing falls between teams.</p>
        <div className="lp-grid">
          {FEATURES.map((f) => (
            <div className="lp-card" key={f.title}>
              <span className="lp-card__icon"><Icon name={f.icon} size={18} /></span>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-roles" id="roles">
        <h2>Three workspaces, one workflow</h2>
        <p className="lp-section__sub">Jump into any view — the data is shared.</p>
        <div className="lp-grid lp-grid--3">
          {ROLE_CARDS.map((r) => (
            <div className="lp-role" key={r.role}>
              <span className="lp-role__icon"><Icon name={r.icon} size={20} /></span>
              <h3>{ROLE_META[r.role].label}</h3>
              <p>{r.blurb}</p>
              <button className="lp-btn lp-btn--ghost" onClick={() => enter(r.role)}>
                Enter {ROLE_META[r.role].label} <Icon name="ArrowRight" size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <footer className="lp-foot">
        <span className="lp-brand lp-brand--sm">
          <img src={logo} alt="Ccentrik" />
          <span>Ccentrik</span>
        </span>
        <span>© {new Date().getFullYear()} Ccentrik · Recruitment &amp; Onboarding · a frontend product demo</span>
      </footer>
    </div>
  );
}
