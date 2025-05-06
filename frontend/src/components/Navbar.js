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
      axios.get('http://localhost:8000/api/notifications/', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(response => {
          setNotifications(response.data);
          setUnreadCount(response.data.filter(n => !n.is_read).length);
        })
        .catch(err => console.error('Ошибка загрузки уведомлений:', err));
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const markAsRead = async (notificationId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.patch(`http://localhost:8000/api/notifications/${notificationId}/`, 
        { is_read: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      setUnreadCount(unreadCount - 1);
    } catch (err) {
      console.error('Ошибка отметки уведомления:', err);
    }
  };

  const handleShowNotifications = () => setShowNotifications(true);
  const handleCloseNotifications = () => setShowNotifications(false);

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">Газпром Карьера</Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Переключить навигацию">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto align-items-center">
              <li className="nav-item">
                <Link className="nav-link" to="/">Главная</Link>
              </li>
              {user ? (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/dashboard">Личный кабинет</Link>
                  </li>
                  {!user.isStaff && (
                    <li className="nav-item">
                      <button 
                        className="nav-link position-relative bg-transparent border-0" 
                        onClick={handleShowNotifications}
                        data-bs-toggle="offcanvas"
                        data-bs-target="#notificationsOffcanvas"
                        aria-controls="notificationsOffcanvas"
                      >
                        <FaBell />
                        {unreadCount > 0 && (
                          <span className="notification-badge">{unreadCount}</span>
                        )}
                      </button>
                    </li>
                  )}
                  <li className="nav-item">
                    <span className="nav-link account-info">{user.fullName}</span>
                  </li>
                  <li className="nav-item">
                    <button className="nav-link btn btn-link" onClick={handleLogout}>Выход</button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/login">Вход</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/register">Регистрация</Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      <div 
        className={`offcanvas offcanvas-end offcanvas-notifications ${showNotifications ? 'show' : ''}`} 
        tabIndex="-1" 
        id="notificationsOffcanvas" 
        aria-labelledby="notificationsOffcanvasLabel"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="notificationsOffcanvasLabel">Уведомления</h5>
          <button 
            type="button" 
            className="btn-close" 
            onClick={handleCloseNotifications} 
            data-bs-dismiss="offcanvas" 
            aria-label="Закрыть"
          ></button>
        </div>
        <div className="offcanvas-body">
          {notifications.length === 0 ? (
            <p>Нет уведомлений</p>
          ) : (
            notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                onClick={() => !notification.is_read && markAsRead(notification.id)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ whiteSpace: 'pre-wrap' }}>{notification.message}</div>
                <small>{new Date(notification.created_at).toLocaleString()}</small>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;