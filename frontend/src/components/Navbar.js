import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import axios from 'axios';
import { FaBell } from 'react-icons/fa';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user && !user.isStaff) {
      const token = localStorage.getItem('token');
      axios
        .get('http://localhost:8000/api/notifications/', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          setNotifications(response.data);
          setUnreadCount(response.data.filter((n) => !n.is_read).length);
        })
        .catch((err) => console.error('Ошибка загрузки уведомлений:', err));
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
      setNotifications(
        notifications.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(unreadCount - 1);
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
                <div className="position-relative">
                  <button
                    className="btn btn-link text-white"
                    onClick={toggleNotifications}
                    title="Уведомления"
                  >
                    <FaBell />
                    {unreadCount > 0 && (
                      <span className="notification-badge">{unreadCount}</span>
                    )}
                  </button>
                  {showNotifications && (
                    <div className="dropdown-menu-notifications show">
                      {notifications.length === 0 ? (
                        <p className="p-3">Нет уведомлений</p>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`notification-item ${
                              !notification.is_read ? 'unread' : ''
                            }`}
                            onClick={() =>
                              !notification.is_read && markAsRead(notification.id)
                            }
                            style={{ cursor: 'pointer' }}
                          >
                            <div style={{ whiteSpace: 'pre-wrap' }}>
                              {notification.message}
                            </div>
                            <small>
                              {new Date(notification.created_at).toLocaleString()}
                            </small>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
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