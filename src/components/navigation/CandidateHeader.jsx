import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Icon from '../common/Icon.jsx';
import Button from '../ta/Button.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { ROLES, ROLE_META } from '../../constants/roles.js';
import { initialsOf } from '../../utils/format.js';

const navClass = ({ isActive }) => (isActive ? 'active' : undefined);

export default function CandidateHeader() {
  const navigate = useNavigate();
  const { setRole, data, getApplication } = useApp();
  const [menu, setMenu] = useState(false);

  const app = data.myApplicationId ? getApplication(data.myApplicationId) : null;
  const name = app ? `${app.personal.firstName} ${app.personal.lastName}` : 'Guest';

  const switchRole = (role) => {
    setRole(role);
    navigate(ROLE_META[role].home);
  };

  return (
    <header className="cx-header">
      <div className="cx-header__inner">
        <NavLink to="/candidate" className="cx-brand">
          <span className="cx-brand__mark">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="#fff" strokeWidth="1.8">
              <circle cx="9" cy="9" r="5" />
              <circle cx="15" cy="9" r="5" />
              <circle cx="12" cy="15" r="5" />
            </svg>
          </span>
          <span>
            <span className="cx-brand__name" style={{ display: 'block' }}>TalentFlow</span>
            <span className="cx-brand__sub" style={{ display: 'block' }}>Careers</span>
          </span>
        </NavLink>

        <nav className="cx-nav">
          <NavLink to="/candidate/jobs" className={navClass}>Jobs</NavLink>
          <NavLink to="/candidate/application" className={navClass}>My Application</NavLink>
        </nav>

        <div className="cx-header__right">
          <div className="cx-usermenu" onBlur={() => setTimeout(() => setMenu(false), 150)}>
            <button className="cx-usermenu__btn" onClick={() => setMenu((m) => !m)} aria-label="Account menu">
              {app ? initialsOf(name) : <Icon name="UserRound" size={17} />}
            </button>
            {menu && (
              <div className="cx-usermenu__panel">
                <div className="cx-usermenu__head">
                  <div className="ta-cell-strong" style={{ fontSize: 12.5 }}>{name}</div>
                  <div className="ta-cell-sub">{app ? app.candidateId : 'Not applied yet'}</div>
                </div>
                <button className="cx-usermenu__item" onMouseDown={() => navigate('/candidate/profile')}>
                  <Icon name="UserRound" size={15} /> My Profile
                </button>
                <button className="cx-usermenu__item" onMouseDown={() => navigate('/candidate/application')}>
                  <Icon name="ClipboardList" size={15} /> My Application
                </button>
                <button className="cx-usermenu__item" onMouseDown={() => switchRole(ROLES.TA)}>
                  <Icon name="RefreshCw" size={15} /> Switch to Talent Acquisition
                </button>
                <button className="cx-usermenu__item" onMouseDown={() => switchRole(ROLES.HR)}>
                  <Icon name="RefreshCw" size={15} /> Switch to HR
                </button>
              </div>
            )}
          </div>
          <Button iconRight="ArrowRight" onClick={() => navigate('/candidate/apply')}>Apply Now</Button>
        </div>
      </div>
    </header>
  );
}
