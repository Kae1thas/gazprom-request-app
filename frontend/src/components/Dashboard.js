import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from './AuthContext';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [candidates, setCandidates] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [resumeContent, setResumeContent] = useState('');
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [resumeToEdit, setResumeToEdit] = useState(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Пожалуйста, войдите, чтобы просмотреть личный кабинет');
      return;
    }

    // Получаем список резюме
    const resumeUrl = user?.isStaff ? 'http://localhost:8000/api/resumes/' : 'http://localhost:8000/api/my-resumes/';
    axios.get(resumeUrl, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => setResumes(response.data))
      .catch(() => setError('Не удалось загрузить резюме'));

    // Получаем список кандидатов только для модераторов
    if (user?.isStaff) {
      axios.get('http://localhost:8000/api/candidates/', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(response => setCandidates(response.data))
        .catch(() => setError('Не удалось загрузить кандидатов'));
    }
  }, [user]);

  // Обработчик отправки резюме
  const handleSubmitResume = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!resumeContent.trim()) {
      setError('Содержание резюме не может быть пустым');
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/api/resume/create/', 
        { content: resumeContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResumes([...resumes, response.data]);
      setResumeContent('');
      setError('');
      toast.success('Резюме успешно отправлено!');
    } catch (err) {
      setError(err.response?.data?.content || 'Ошибка при отправке резюме');
    }
  };

  // Открытие модального окна для подтверждения удаления
  const handleOpenDeleteModal = (resumeId) => {
    setResumeToDelete(resumeId);
    setShowDeleteModal(true);
  };

  // Закрытие модального окна удаления
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setResumeToDelete(null);
  };

  // Обработчик удаления резюме
  const handleDeleteResume = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:8000/api/resume/${resumeToDelete}/delete/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResumes(resumes.filter(resume => resume.id !== resumeToDelete));
      toast.success('Резюме успешно удалено!');
      handleCloseDeleteModal();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при удалении резюме');
      handleCloseDeleteModal();
    }
  };

  // Открытие модального окна для редактирования
  const handleOpenEditModal = (resume) => {
    setResumeToEdit(resume.id);
    setEditContent(resume.content);
    setShowEditModal(true);
  };

  // Закрытие модального окна редактирования
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setResumeToEdit(null);
    setEditContent('');
  };

  // Обработчик редактирования резюме
  const handleEditResume = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!editContent.trim()) {
      setError('Содержание резюме не может быть пустым');
      return;
    }

    try {
      const response = await axios.patch(`http://localhost:8000/api/resume/${resumeToEdit}/edit/`, 
        { content: editContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResumes(resumes.map(resume => 
        resume.id === resumeToEdit ? response.data : resume
      ));
      toast.success('Резюме успешно обновлено!');
      handleCloseEditModal();
    } catch (err) {
      setError(err.response?.data?.content || 'Ошибка при обновлении резюме');
    }
  };

  // Обработчик изменения статуса резюме
  const handleStatusUpdate = async (resumeId, newStatus) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.patch(`http://localhost:8000/api/resume/${resumeId}/status/`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResumes(resumes.map(resume => 
        resume.id === resumeId ? { ...resume, status: response.data.status } : resume
      ));
      toast.success(`Статус резюме обновлён: ${newStatus}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при обновлении статуса');
    }
  };

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Личный кабинет</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      
      {/* Форма подачи резюме для кандидатов */}
      {!user?.isStaff && (
        <div className="card mb-4">
          <h2 className="card-header">Подать резюме</h2>
          <div className="card-body">
            <form onSubmit={handleSubmitResume}>
              <div className="mb-3">
                <label htmlFor="resumeContent" className="form-label">Содержание резюме</label>
                <textarea
                  className="form-control"
                  id="resumeContent"
                  rows="5"
                  value={resumeContent}
                  onChange={(e) => setResumeContent(e.target.value)}
                  placeholder="Введите содержание вашего резюме"
                />
              </div>
              <button type="submit" className="btn btn-primary">Отправить резюме</button>
            </form>
          </div>
        </div>
      )}

      {/* Список резюме для кандидатов или всех резюме для модераторов */}
      <div className="card mb-4">
        <h2 className="card-header">{user?.isStaff ? 'Все резюме' : 'Ваши резюме'}</h2>
        <div className="card-body">
          {resumes.length === 0 ? (
            <p>{user?.isStaff ? 'Резюме отсутствуют.' : 'У вас пока нет резюме.'}</p>
          ) : (
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Кандидат</th>
                  <th>Содержание</th>
                  <th>Статус</th>
                  <th>Дата создания</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {resumes.map(resume => (
                  <tr key={resume.id}>
                    <td>{resume.candidate?.user.last_name} {resume.candidate?.user.first_name} {resume.candidate?.user.patronymic}</td>
                    <td>{resume.content.substring(0, 50)}...</td>
                    <td>{resume.status}</td>
                    <td>{new Date(resume.created_at).toLocaleDateString()}</td>
                    <td className="align-middle">
                      {!user?.isStaff && (
                        <div className="d-flex align-items-center gap-2">
                          <button 
                            className="btn btn-edit btn-square btn-sm"
                            onClick={() => handleOpenEditModal(resume)}
                            title="Редактировать резюме"
                          >
                            ✎
                          </button>
                          <button 
                            className="btn btn-danger btn-square btn-sm"
                            onClick={() => handleOpenDeleteModal(resume.id)}
                            title="Удалить резюме"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                      {user?.isStaff && resume.status === 'PENDING' && (
                        <>
                          <button 
                            className="btn btn-success btn-sm me-2"
                            onClick={() => handleStatusUpdate(resume.id, 'ACCEPTED')}
                          >
                            Принять
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleStatusUpdate(resume.id, 'REJECTED')}
                          >
                            Отклонить
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Модальное окно подтверждения удаления */}
      <div className={`modal fade ${showDeleteModal ? 'show' : ''}`} style={{ display: showDeleteModal ? 'block' : 'none' }} tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Подтверждение удаления</h5>
              <button type="button" className="btn-close" onClick={handleCloseDeleteModal}></button>
            </div>
            <div className="modal-body">
              Вы уверены, что хотите удалить это резюме? Это действие нельзя отменить.
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleCloseDeleteModal}>
                Отмена
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDeleteResume}>
                Удалить
              </button>
            </div>
          </div>
        </div>
      </div>
      {showDeleteModal && <div className="modal-backdrop fade show"></div>}

      {/* Модальное окно редактирования резюме */}
      <div className={`modal fade ${showEditModal ? 'show' : ''}`} style={{ display: showEditModal ? 'block' : 'none' }} tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Редактировать резюме</h5>
              <button type="button" className="btn-close" onClick={handleCloseEditModal}></button>
            </div>
            <form onSubmit={handleEditResume}>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="editContent" className="form-label">Содержание резюме</label>
                  <textarea
                    className="form-control"
                    id="editContent"
                    rows="5"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Введите содержание резюме"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseEditModal}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {showEditModal && <div className="modal-backdrop fade show"></div>}

      {/* Список кандидатов только для модераторов */}
      {user?.isStaff && (
        <div className="card mb-4">
          <h2 className="card-header">Кандидаты</h2>
          <div className="card-body">
            {candidates.length === 0 ? (
              <p>Кандидаты отсутствуют.</p>
            ) : (
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Имя</th>
                    <th>Email</th>
                    <th>Образование</th>
                    <th>Телефон</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map(candidate => (
                    <tr key={candidate.id}>
                      <td>{candidate.user.last_name} {candidate.user.first_name} {candidate.user.patronymic}</td>
                      <td>{candidate.user.email}</td>
                      <td>{candidate.education || 'N/A'}</td>
                      <td>{candidate.phone_number || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;