import { useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/navigation/Sidebar.jsx';
import Topbar from '../components/navigation/Topbar.jsx';
import { ROLES } from '../constants/roles.js';
import { useApp } from '../context/AppContext.jsx';
import { APP_STATUS, OFFER_STATUS } from '../constants/statuses.js';

export default function HRLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { data } = useApp();

  const counts = useMemo(() => {
    const offers = data.offers || [];
    const apps = data.applications || [];
    return {
      offers: offers.filter((o) => o.status === OFFER_STATUS.PENDING_APPROVAL).length,
      joining: apps.filter((a) => a.status === APP_STATUS.JOINING_PENDING).length,
    };
  }, [data]);

  const items = [
    { to: '/hr', label: 'Dashboard', icon: 'LayoutDashboard', end: true },
    { to: '/hr/candidates', label: 'Candidates', icon: 'Users' },
    { to: '/hr/offers', label: 'Offers', icon: 'FileCheck', count: counts.offers },
    { to: '/hr/documents', label: 'Document Verification', icon: 'Files' },
    { to: '/hr/employees', label: 'Employees', icon: 'UserRoundCheck', count: counts.joining },
    { to: '/hr/activity', label: 'Activity', icon: 'History' },
  ];
  const footerItems = [
    { to: '/hr/settings', label: 'Settings', icon: 'Settings' },
    { to: '/hr/profile', label: 'Profile', icon: 'CircleUserRound' },
  ];

  return (
    <div className="app-shell">
      <Sidebar title="Human Resources" items={items} footerItems={footerItems} open={open} onNavigate={() => setOpen(false)} />
      {open && <div className="overlay" style={{ zIndex: 39 }} onClick={() => setOpen(false)} />}
      <div className="app-main">
        <Topbar role={ROLES.HR} base="/hr" greeting="Human Resources" onToggleSidebar={() => setOpen((o) => !o)} />
        <div className="grow route-view" key={pathname}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
