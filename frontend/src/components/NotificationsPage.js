import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from './AuthContext';
import { FaCheckCircle, FaFilter } from 'react-icons/fa';
import { Button, FormControl, InputLabel, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

const NotificationsPage = () => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all');

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

  const filteredNotifications = filterType === 'all'
    ? notifications
    : notifications.filter((n) => n.type === filterType);

  if (loading) return <div className="container mt-5">Загрузка...</div>;
  if (error) return <div className="container mt-5 alert alert-danger">{error}</div>;

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Уведомления</h1>
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h2 className="mb-0">Ваши уведомления</h2>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="filter-type-label">Фильтр по типу</InputLabel>
            <Select
              labelId="filter-type-label"
              value={filterType}
              label="Фильтр по типу"
              onChange={(e) => setFilterType(e.target.value)}
            >
              <MenuItem value="all">Все</MenuItem>
              <MenuItem value="REGISTRATION">Регистрация</MenuItem>
              <MenuItem value="RESUME_STATUS">Статус резюме</MenuItem>
              <MenuItem value="INTERVIEW">Собеседование</MenuItem>
              <MenuItem value="DOCUMENT">Документ</MenuItem>
              <MenuItem value="HIRE">Прием</MenuItem>
            </Select>
          </FormControl>
        </div>
        <div className="card-body">
          {filteredNotifications.length === 0 ? (
            <p>Уведомления отсутствуют.</p>
          ) : (
            <>
              <Button
                variant="contained"
                color="primary"
                onClick={markAllAsRead}
                disabled={filteredNotifications.every((n) => n.is_read)}
                sx={{ mb: 2 }}
              >
                Пометить все как прочитанные
              </Button>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Тип</TableCell>
                      <TableCell>Сообщение</TableCell>
                      <TableCell>Дата</TableCell>
                      <TableCell>Статус</TableCell>
                      <TableCell>Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredNotifications.map((notification) => (
                      <TableRow key={notification.id}>
                        <TableCell>
                          {{
                            'REGISTRATION': 'Регистрация',
                            'RESUME_STATUS': 'Статус резюме',
                            'INTERVIEW': 'Собеседование',
                            'DOCUMENT': 'Документ',
                            'HIRE': 'Прием'
                          }[notification.type] || 'Другое'}
                        </TableCell>
                        <TableCell style={{ whiteSpace: 'pre-wrap' }}>{notification.message}</TableCell>
                        <TableCell>{new Date(notification.created_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <span
                            className={`badge ${notification.is_read ? 'bg-success' : 'bg-warning'}`}
                          >
                            {notification.is_read ? 'Прочитано' : 'Непрочитано'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {!notification.is_read && (
                            <Button
                              variant="outlined"
                              color="primary"
                              onClick={() => markAsRead(notification.id)}
                              startIcon={<FaCheckCircle />}
                              title="Пометить как прочитанное"
                            >
                              Прочитать
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;