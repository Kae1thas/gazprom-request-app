import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from './AuthContext';
import { Button, Card } from '@mui/material';
import { FaEye } from 'react-icons/fa';

const InterviewPage = () => {
  const { user } = useContext(AuthContext);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [interviewToView, setInterviewToView] = useState(null);
  const [statusComment, setStatusComment] = useState('');

  useEffect(() => {
    if (!user) {
      setError('Пожалуйста, войдите, чтобы просмотреть собеседования');
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Токен авторизации отсутствует');
      setLoading(false);
      return;
    }

    const interviewUrl = user.isStaff ? 'http://localhost:8000/api/interviews/' : 'http://localhost:8000/api/interviews/my/';
    axios
      .get(interviewUrl, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setInterviews(response.data);
        setLoading(false);
      })
      .catch((err) => {
        const errorMsg = err.response?.data?.error || 'Не удалось загрузить собеседования';
        setError(errorMsg);
        setLoading(false);
      });
  }, [user]);

  const handleOpenViewModal = (interview) => {
    setInterviewToView(interview);
    setStatusComment('');
    setShowViewModal(true);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setInterviewToView(null);
    setStatusComment('');
  };

  const handleStatusUpdate = async (interviewId, newStatus, newResult) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.patch(
        `http://localhost:8000/api/interviews/${interviewId}/`,
        { status: newStatus, result: newResult, comment: statusComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInterviews(
        interviews.map((interview) =>
          interview.id === interviewId ? response.data : interview
        )
      );
      toast.success(`Статус собеседования обновлён: ${newStatus}`);
      handleCloseViewModal();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Ошибка при обновлении статуса';
      toast.error(errorMsg);
      setError(errorMsg);
    }
  };

  if (loading) return <div className="container mt-5">Загрузка...</div>;
  if (error) return <div className="container mt-5 alert alert-danger">{error}</div>;

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Собеседования</h1>
      <div className="card mb-4">
        <h2 className="card-header">{user?.isStaff ? 'Все собеседования' : 'Ваши собеседования'}</h2>
        <div className="card-body">
          {interviews.length === 0 ? (
            <p>{user?.isStaff ? 'Собеседования отсутствуют.' : 'У вас пока нет запланированных собеседований.'}</p>
          ) : (
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Кандидат</th>
                  <th>Сотрудник</th>
                  <th>Дата и время</th>
                  <th>Статус</th>
                  <th>Результат</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {interviews.map((interview) => (
                  <tr key={interview.id}>
                    <td>
                      {interview.candidate?.user
                        ? `${interview.candidate.user.last_name || ''} ${interview.candidate.user.first_name || ''} ${
                            interview.candidate.user.patronymic || ''
                          }`.trim()
                        : 'Кандидат не указан'}
                    </td>
                    <td>
                      {interview.employee
                        ? `${interview.employee.user.last_name || ''} ${interview.employee.user.first_name || ''} ${
                            interview.employee.user.patronymic || ''
                          }`.trim()
                        : 'Сотрудник не указан'}
                    </td>
                    <td>{new Date(interview.scheduled_at).toLocaleString()}</td>
                    <td>
                      <span
                        className={`badge ${
                          interview.status === 'SCHEDULED'
                            ? 'bg-warning'
                            : interview.status === 'COMPLETED'
                            ? 'bg-success'
                            : 'bg-danger'
                        }`}
                      >
                        {interview.status === 'SCHEDULED'
                          ? 'Запланировано'
                          : interview.status === 'COMPLETED'
                          ? 'Проведено'
                          : 'Отменено'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          interview.result === 'SUCCESS'
                            ? 'bg-success'
                            : interview.result === 'FAILURE'
                            ? 'bg-danger'
                            : 'bg-warning'
                        }`}
                      >
                        {interview.result === 'SUCCESS'
                          ? 'Успешно'
                          : interview.result === 'FAILURE'
                          ? 'Неуспешно'
                          : 'Ожидает'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-square btn-primary"
                        onClick={() => handleOpenViewModal(interview)}
                        title="Просмотреть собеседование"
                      >
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className={`modal fade ${showViewModal ? 'show' : ''}`} style={{ display: showViewModal ? 'block' : 'none' }} tabIndex="-1">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Просмотр собеседования</h5>
              <button type="button" className="btn-close" onClick={handleCloseViewModal}></button>
            </div>
            <div className="modal-body">
              {interviewToView && (
                <>
                  <h6>
                    Кандидат:{' '}
                    {`${interviewToView.candidate?.user.last_name || ''} ${
                      interviewToView.candidate?.user.first_name || ''
                    } ${interviewToView.candidate?.user.patronymic || ''}`.trim()}
                  </h6>
                  <p>
                    <strong>Email:</strong> {interviewToView.candidate?.user.email || 'Не указан'}
                  </p>
                  <h6>
                    Сотрудник:{' '}
                    {`${interviewToView.employee?.user.last_name || ''} ${
                      interviewToView.employee?.user.first_name || ''
                    } ${interviewToView.employee?.user.patronymic || ''}`.trim()}
                  </h6>
                  <p>
                    <strong>Должность:</strong> {interviewToView.employee?.position || 'Не указана'}
                  </p>
                  <p>
                    <strong>Дата и время:</strong> {new Date(interviewToView.scheduled_at).toLocaleString()}
                  </p>
                  <p>
                    <strong>Статус:</strong>{' '}
                    {interviewToView.status === 'SCHEDULED'
                      ? 'Запланировано'
                      : interviewToView.status === 'COMPLETED'
                      ? 'Проведено'
                      : 'Отменено'}
                  </p>
                  <p>
                    <strong>Результат:</strong>{' '}
                    {interviewToView.result === 'SUCCESS'
                      ? 'Успешно'
                      : interviewToView.result === 'FAILURE'
                      ? 'Неуспешно'
                      : 'Ожидает'}
                  </p>
                  {user?.isStaff && interviewToView.status === 'SCHEDULED' && (
                    <div className="mt-3">
                      <label htmlFor="statusComment" className="form-label">
                        Комментарий к статусу
                      </label>
                      <textarea
                        className="form-control"
                        id="statusComment"
                        rows="3"
                        value={statusComment}
                        onChange={(e) => setStatusComment(e.target.value)}
                        placeholder="Введите комментарий"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-action btn-secondary" onClick={handleCloseViewModal}>
                Закрыть
              </button>
              {user?.isStaff && interviewToView?.status === 'SCHEDULED' && (
                <>
                  <button
                    className="btn btn-action btn-success"
                    onClick={() => handleStatusUpdate(interviewToView.id, 'COMPLETED', 'SUCCESS')}
                  >
                    Успешно завершено
                  </button>
                  <button
                    className="btn btn-action btn-danger"
                    onClick={() => handleStatusUpdate(interviewToView.id, 'COMPLETED', 'FAILURE')}
                  >
                    Неуспешно завершено
                  </button>
                  <button
                    className="btn btn-action btn-secondary"
                    onClick={() => handleStatusUpdate(interviewToView.id, 'CANCELLED', 'PENDING')}
                  >
                    Отменить
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {showViewModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default InterviewPage;