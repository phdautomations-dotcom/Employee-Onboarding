import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Icon from '../common/Icon.jsx';
import Button from '../common/Button.jsx';
import RoleSwitcher from './RoleSwitcher.jsx';
import { useApp } from '../../context/AppContext.jsx';

export default function CandidateHeader() {
  const navigate = useNavigate();
  const { setRole, data, getApplication } = useApp();
  const [menu, setMenu] = useState(false);

  const app = data.myApplicationId ? getApplication(data.myApplicationId) : null;
  const name = app ? `${app.personal.firstName} ${app.personal.lastName}` : 'Guest';

  return (
    <header className="cheader">
      <div className="cheader__inner">
        <NavLink to="/candidate" className="brand">
          <span className="brand__mark">TF</span>
          <span>TalentFlow</span>
        </NavLink>

        <nav className="cheader__nav">
          <NavLink to="/candidate/jobs" className={({ isActive }) => (isActive ? 'active' : '')}>
            Jobs
          </NavLink>
          <NavLink to="/candidate/application" className={({ isActive }) => (isActive ? 'active' : '')}>
            My Application
          </NavLink>
        </nav>

        <div className="cheader__right">
          <RoleSwitcher compact />
          <div className="profile-menu" onBlur={() => setTimeout(() => setMenu(false), 150)}>
            <button className="profile-menu__trigger" aria-label="Profile menu" onClick={() => setMenu((m) => !m)}>
              <Icon name="CircleUserRound" size={20} />
            </button>
            {menu && (
              <div className="profile-menu__panel">
                <div className="profile-menu__head">
                  <div className="strong text-small">{name}</div>
                  <div className="text-xs text-secondary">{app ? app.candidateId : 'Not applied yet'}</div>
                </div>
                <button className="profile-menu__item" onMouseDown={() => navigate('/candidate/profile')}>
                  <Icon name="UserRound" size={16} /> My Profile
                </button>
                <button className="profile-menu__item" onMouseDown={() => navigate('/candidate/application')}>
                  <Icon name="ClipboardList" size={16} /> My Application
                </button>
                <button
                  className="profile-menu__item"
                  onMouseDown={() => {
                    setRole(null);
                    navigate('/login');
                  }}
                >
                  <Icon name="LogOut" size={16} /> Exit
                </button>
              </div>
            )}
          </div>
          <Button icon="ArrowRight" onClick={() => navigate('/candidate/apply')}>
            Apply Now
          </Button>
        </div>
      </div>
    </header>
  );
}
