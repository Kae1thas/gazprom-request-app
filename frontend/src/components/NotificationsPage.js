import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from './AuthContext';
import { FaCheckCircle } from 'react-icons/fa';

const NotificationsPage = () => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setError('Пожалуйста, войдите, чтобы просмотреть уведомления');
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    axios
      .get('http://localhost:8000/api/notifications/', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setNotifications(response.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Не удалось загрузить уведомления');
        setLoading(false);
      });
  }, [user]);

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
      toast.success('Уведомление помечено как прочитанное');
    } catch (err) {
      toast.error('Ошибка при отметке уведомления');
    }
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem('token');
    try {
      await Promise.all(
        notifications
          .filter((n) => !n.is_read)
          .map((n) =>
            axios.patch(
              `http://localhost:8000/api/notifications/${n.id}/`,
              { is_read: true },
              { headers: { Authorization: `Bearer ${token}` } }
            )
          )
      );
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
      toast.success('Все уведомления помечены как прочитанные');
    } catch (err) {
      toast.error('Ошибка при отметке всех уведомлений');
    }
  };

  if (loading) return <div className="container mt-5">Загрузка...</div>;
  if (error) return <div className="container mt-5 alert alert-danger">{error}</div>;

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Уведомления</h1>
      <div className="card mb-4">
        <h2 className="card-header">Ваши уведомления</h2>
        <div className="card-body">
          {notifications.length === 0 ? (
            <p>Уведомления отсутствуют.</p>
          ) : (
            <>
              <button
                className="btn btn-primary mb-3"
                onClick={markAllAsRead}
                disabled={notifications.every((n) => n.is_read)}
              >
                Пометить все как прочитанные
              </button>
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Сообщение</th>
                    <th>Дата</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((notification) => (
                    <tr key={notification.id}>
                      <td style={{ whiteSpace: 'pre-wrap' }}>{notification.message}</td>
                      <td>{new Date(notification.created_at).toLocaleString()}</td>
                      <td>
                        <span
                          className={`badge ${notification.is_read ? 'bg-success' : 'bg-warning'}`}
                        >
                          {notification.is_read ? 'Прочитано' : 'Непрочитано'}
                        </span>
                      </td>
                      <td>
                        {!notification.is_read && (
                          <button
                            className="btn btn-square btn-primary"
                            onClick={() => markAsRead(notification.id)}
                            title="Пометить как прочитанное"
                          >
                            <FaCheckCircle />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;