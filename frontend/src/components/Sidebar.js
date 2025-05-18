import React, { useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Offcanvas } from 'react-bootstrap';
import { AuthContext } from './AuthContext';
import { Home, Description, CalendarToday, AttachFile, Notifications, CheckCircle, Assignment } from '@mui/icons-material';
import '../index.css';

const Sidebar = () => {
  const { user, hasSuccessfulInterview } = useContext(AuthContext);
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const candidateMenuItems = [
    { path: '/home', label: 'Главная', icon: <Home /> },
    { path: '/resume', label: 'Моё резюме', icon: <Description /> },
    { path: '/interview', label: 'Собеседование', icon: <CalendarToday /> },
    ...(hasSuccessfulInterview.JOB || hasSuccessfulInterview.PRACTICE
      ? [{ path: '/documents', label: 'Документы', icon: <AttachFile /> }]
      : []),
    { path: '/notifications', label: 'Уведомления', icon: <Notifications /> },
    { path: '/final-status', label: 'Финальный статус', icon: <CheckCircle /> },
  ];

  const moderatorMenuItems = [
    { path: '/home', label: 'Главная', icon: <Home /> },
    { path: '/resume/moderator', label: 'Резюме', icon: <Description /> },
    { path: '/interview/moderator', label: 'Собеседования', icon: <CalendarToday /> },
    { path: '/documents/moderator', label: 'Документы', icon: <Assignment /> },
  ];

  const menuItems = user?.isStaff ? moderatorMenuItems : candidateMenuItems;

  const toggleSidebar = () => setIsOpen(!isOpen);

  if (!user) return null;

  return (
    <>
      <div className="sidebar d-none d-md-block">
        <div className="sidebar-header">
          <h4 className="text-white p-3"> </h4>
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

      <div className="d-md-none">
        <button className="btn btn-primary hamburger" onClick={toggleSidebar}>
          ☰
        </button>
        <Offcanvas show={isOpen} onHide={toggleSidebar} className="offcanvas">
          <Offcanvas.Body>
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
          </Offcanvas.Body>
        </Offcanvas>
      </div>
    </>
  );
};

export default Sidebar;