import { NavLink } from 'react-router-dom';
import Icon from '../common/Icon.jsx';

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
    </aside>
  );
}
