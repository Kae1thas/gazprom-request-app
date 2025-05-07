import React, { useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import { Home, Description, CalendarToday, AttachFile, Notifications, CheckCircle } from '@mui/icons-material';

const Sidebar = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { path: '/', label: 'Главная', icon: <Home /> },
    { path: '/resume', label: 'Моё резюме', icon: <Description /> },
    { path: '/interview', label: 'Собеседование', icon: <CalendarToday /> },
    { path: '/documents', label: 'Документы', icon: <AttachFile /> },
    { path: '/notifications', label: 'Уведомления', icon: <Notifications /> },
    { path: '/final-status', label: 'Финальный статус', icon: <CheckCircle /> },
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

  if (!user) return null;

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="sidebar d-none d-md-block">
        <div className="sidebar-header">
          <h4 className="text-white p-3">Газпром Карьера</h4>
        </div>
        <ul className="sidebar-menu">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
                title={item.label}
              >
                {item.icon}
                <span className="ms-2">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Mobile Offcanvas Sidebar */}
      <div className="d-md-none">
        <button className="btn btn-primary hamburger" onClick={toggleSidebar}>
          ☰
        </button>
        <div className={`offcanvas offcanvas-start ${isOpen ? 'show' : ''}`} tabIndex="-1">
          <div className="offcanvas-header">
            <h5 className="offcanvas-title">Газпром Карьера</h5>
            <button className="btn-close" onClick={toggleSidebar}></button>
          </div>
          <div className="offcanvas-body">
            <ul className="sidebar-menu">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
                    onClick={toggleSidebar}
                    title={item.label}
                  >
                    {item.icon}
                    <span className="ms-2">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;