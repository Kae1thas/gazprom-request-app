import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import axios from 'axios';
import { FaBell } from 'react-icons/fa';
import { Dropdown } from 'react-bootstrap';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    if (user && !user.isStaff) {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get('http://localhost:8000/api/notifications/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const unreadNotifications = response.data.filter((n) => !n.is_read);
        setNotifications(unreadNotifications);
        setUnreadCount(unreadNotifications.length);
      } catch (err) {
        console.error('Ошибка загрузки уведомлений:', err);
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
    if (user && !user.isStaff) {
      const interval = setInterval(fetchNotifications, 10000); // Polling каждые 10 секунд
      const handleNotificationRead = (event) => {
        if (event.detail.all) {
          setNotifications([]);
          setUnreadCount(0);
        } else {
          setNotifications((prev) => prev.filter((n) => n.id !== event.detail.notificationId));
          setUnreadCount((prev) => prev - 1);
        }
      };
      window.addEventListener('notificationRead', handleNotificationRead);
      return () => {
        clearInterval(interval);
        window.removeEventListener('notificationRead', handleNotificationRead);
      };
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/home');
  };

  const markAsRead = async (notificationId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.patch(
        `http://localhost:8000/api/notifications/${notificationId}/`,
        { is_read: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(notifications.filter((n) => n.id !== notificationId));
      setUnreadCount(unreadCount - 1);
      window.dispatchEvent(new CustomEvent('notificationRead', { detail: { notificationId } }));
    } catch (err) {
      console.error('Ошибка отметки уведомления:', err);
    }
  };

  const toggleNotifications = () => setShowNotifications(!showNotifications);

  return (
    <nav className={`navbar navbar-expand-lg navbar-dark ${!user ? 'no-sidebar' : ''}`}>
      <div className="container-fluid">
        <Link className="navbar-brand" to="/home">
          Газпром Карьера
        </Link>
        <div className="ms-auto d-flex align-items-center">
          {user ? (
            <>
              <span className="account-info me-3">{user.fullName}</span>
              {!user.isStaff && (
                <Dropdown show={showNotifications} onToggle={toggleNotifications}>
                  <Dropdown.Toggle
                    as="button"
                    className="btn btn-link text-white position-relative"
                    title="Уведомления"
                  >
                    <FaBell />
                    {unreadCount > 0 && (
                      <span className="notification-badge bg-danger rounded-circle position-absolute top-0 start-100 translate-middle">
                        {unreadCount}
                      </span>
                    )}
                  </Dropdown.Toggle>
                  <Dropdown.Menu align="end" className="dropdown-menu-notifications">
                    {notifications.length === 0 ? (
                      <Dropdown.Item disabled>Нет непрочитанных уведомлений</Dropdown.Item>
                    ) : (
                      notifications.map((notification) => (
                        <Dropdown.Item
                          key={notification.id}
                          onClick={() => markAsRead(notification.id)}
                          className="notification-item unread bg-light"
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="d-flex justify-content-between">
                            <strong>
                              {{
                                'REGISTRATION': 'Регистрация',
                                'RESUME_STATUS': 'Статус резюме',
                                'INTERVIEW': 'Собеседование',
                                'DOCUMENT': 'Документ',
                                'HIRE': 'Прием'
                              }[notification.type] || 'Другое'}
                            </strong>
                            <small>{new Date(notification.created_at).toLocaleTimeString()}</small>
                          </div>
                          <div style={{ whiteSpace: 'pre-wrap' }}>{notification.message}</div>
                        </Dropdown.Item>
                      ))
                    )}
                    <Dropdown.Item as={Link} to="/notifications">
                      Показать все уведомления
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              )}
              <button
                className="btn btn-link text-white ms-3"
                onClick={handleLogout}
                title="Выйти"
              >
                Выход
              </button>
            </>
          ) : (
            <>
              <Link className="nav-link me-3" to="/login">
                Вход
              </Link>
              <Link className="nav-link" to="/register">
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;