import { Outlet, useLocation } from 'react-router-dom';
import CandidateHeader from '../components/navigation/CandidateHeader.jsx';

export default function CandidateLayout() {
  const { pathname } = useLocation();
  return (
    <div className="cand stack" style={{ minHeight: '100vh', background: 'var(--color-page-bg)' }}>
      <CandidateHeader />
      <main className="grow route-view" key={pathname}>
        <Outlet />
      </main>
      <footer style={{ borderTop: '1px solid var(--color-border-light)', background: '#fff' }}>
        <div className="cwrap" style={{ padding: '20px 24px', color: 'var(--color-text-secondary)', fontSize: 12 }}>
          © 2026 TalentFlow · Recruitment &amp; Onboarding
        </div>
      </footer>
    </div>
  );
}
