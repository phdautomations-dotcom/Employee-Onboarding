import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Icon from '../common/Icon.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { DEMO_USERS, ROLES, ROLE_META } from '../../constants/roles.js';

const OTHER_ROLES = [ROLES.TA, ROLES.CANDIDATE];

/* Same overlapping-rings logo mark as TASidebar, so both portals share one brand. */
function BrandMark() {
  return (
    <span className="ta-brand__mark">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth="1.8">
        <circle cx="9" cy="9" r="5" />
        <circle cx="15" cy="9" r="5" />
        <circle cx="12" cy="15" r="5" />
      </svg>
    </span>
  );
}

export default function HRSidebar({ open, collapsed, onToggleCollapse, onNavigate, navItems }) {
  const navigate = useNavigate();
  const { setRole } = useApp();
  const [menu, setMenu] = useState(false);
  const user = DEMO_USERS[ROLES.HR];

  const switchTo = (role) => {
    setRole(role);
    navigate(ROLE_META[role].home);
  };

  return (
    <aside className={`ta-sidebar${open ? ' ta-sidebar--open' : ''}`}>
      <button
        className="ta-collapse-btn"
        onClick={onToggleCollapse}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <Icon name={collapsed ? 'ChevronRight' : 'ChevronLeft'} size={14} />
      </button>

      <div className="ta-brand">
        <BrandMark />
        <span className="ta-brand__text">
          <span className="ta-brand__name">TalentFlow</span>
          <span className="ta-brand__sub">HR Portal</span>
        </span>
      </div>

      <nav className="ta-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `ta-nav__link${isActive ? ' active' : ''}`}
            onClick={onNavigate}
            title={item.label}
          >
            <Icon name={item.icon} size={19} />
            <span className="ta-nav__label">{item.label}</span>
            {!!item.count && <span className="ta-nav__count">{item.count}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="ta-sidebar__spacer" />

      <a className="ta-help" href="mailto:support@talentflow.example" title="Visit our Help Center">
        <span className="ta-help__icon"><Icon name="LifeBuoy" size={16} /></span>
        <span className="ta-help__text">
          <span className="ta-help__title">Need help?</span>
          <span className="ta-help__sub">Visit our Help Center</span>
        </span>
      </a>

      {menu && (
        <div className="ta-menu" onMouseLeave={() => setMenu(false)}>
          {OTHER_ROLES.map((role) => (
            <button key={role} className="ta-menu__item" onClick={() => switchTo(role)}>
              <Icon name="RefreshCw" size={15} /> Switch to {ROLE_META[role].label}
            </button>
          ))}
          <button className="ta-menu__item" onClick={() => switchTo(ROLES.CANDIDATE)}>
            <Icon name="LogOut" size={15} /> Sign out
          </button>
        </div>
      )}

      <button className="ta-usercard" onClick={() => setMenu((m) => !m)} title={user.name}>
        <span className="ta-avatar ta-avatar--sm">{user.initials}</span>
        <span className="ta-usercard__text">
          <span className="ta-usercard__name">{user.name}</span>
          <span className="ta-usercard__role">Human Resources</span>
        </span>
        <Icon name="ChevronDown" size={15} />
      </button>
    </aside>
  );
}
