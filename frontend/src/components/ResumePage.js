import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from './AuthContext';
import { Navigate } from 'react-router-dom';
import Select from 'react-select';
import { IMaskInput } from 'react-imask';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';

const ResumePage = () => {
  const { user, loading } = useContext(AuthContext);
  const [resumes, setResumes] = useState([]);
  const [resumeContent, setResumeContent] = useState('');
  const [education, setEducation] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [resumeToEdit, setResumeToEdit] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editEducation, setEditEducation] = useState(null);
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [resumeToView, setResumeToView] = useState(null);
  const [statusComment, setStatusComment] = useState('');

  const educationOptions = [
    { value: 'SECONDARY', label: 'Среднее' },
    { value: 'HIGHER', label: 'Высшее' },
    { value: 'POSTGRADUATE', label: 'Аспирантура' }
  ];

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setError('Пожалуйста, войдите, чтобы просмотреть личный кабинет');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Токен авторизации отсутствует');
      return;
    }

    const resumeUrl = user.isStaff ? 'http://localhost:8000/api/resumes/' : 'http://localhost:8000/api/resumes/my/';
    axios
      .get(resumeUrl, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => setResumes(response.data))
      .catch(err => {
        const errorMsg = err.response?.data?.error || 'Не удалось загрузить резюме';
        setError(errorMsg);
      });
  }, [user, loading]);

  const handleSubmitResume = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Токен авторизации отсутствует');
      return;
    }
    if (!resumeContent.trim()) {
      setError('Содержание резюме не может быть пустым');
      return;
    }

    // Очищаем номер телефона, удаляя пробелы, скобки и дефисы
    const cleanedPhoneNumber = phoneNumber ? phoneNumber.replace(/[\s()-]/g, '') : '';
    console.log('phoneNumber:', phoneNumber);
    console.log('cleanedPhoneNumber:', cleanedPhoneNumber);

    // Проверяем, что номер телефона либо пустой, либо валидный
    if (cleanedPhoneNumber && (!cleanedPhoneNumber.startsWith('+7') || cleanedPhoneNumber.length !== 12)) {
      setError('Номер телефона должен начинаться с +7 и содержать 12 символов');
      return;
    }

    const payload = {
      content: resumeContent.trim(),
      education: education?.value || '',
      phone_number: cleanedPhoneNumber
    };
    console.log('Data sent to server:', payload);

    try {
      const response = await axios.post(
        'http://localhost:8000/api/resume/create/',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResumes([...resumes, response.data]);
      setResumeContent('');
      setEducation(null);
      setPhoneNumber('');
      setError('');
      toast.success('Резюме успешно отправлено!');
    } catch (err) {
      const errorMsg = err.response?.data?.content ||
                       err.response?.data?.phone_number ||
                       err.response?.data?.error ||
                       'Ошибка при отправке резюме';
      console.error('Error:', err.response?.data);
      toast.error(errorMsg);
      setError(errorMsg);
    }
  };

  const handleOpenDeleteModal = (resumeId) => {
    setResumeToDelete(resumeId);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setResumeToDelete(null);
  };

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
      const errorMsg = err.response?.data?.error || 'Ошибка при удалении резюме';
      toast.error(errorMsg);
      setError(errorMsg);
      handleCloseDeleteModal();
    }
  };

  const handleOpenEditModal = (resume) => {
    setResumeToEdit(resume.id);
    setEditContent(resume.content);
    setEditEducation(educationOptions.find(opt => opt.value === resume.education) || null);
    setEditPhoneNumber(resume.phone_number || '');
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setResumeToEdit(null);
    setEditContent('');
    setEditEducation(null);
    setEditPhoneNumber('');
  };

  const handleEditResume = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!editContent.trim()) {
      setError('Содержание резюме не может быть пустым');
      return;
    }

    const cleanedPhoneNumber = editPhoneNumber ? editPhoneNumber.replace(/[\s()-]/g, '') : '';
    console.log('editPhoneNumber:', editPhoneNumber);
    console.log('cleanedPhoneNumber:', cleanedPhoneNumber);

    if (cleanedPhoneNumber && (!cleanedPhoneNumber.startsWith('+7') || cleanedPhoneNumber.length !== 12)) {
      setError('Номер телефона должен начинаться с +7 и содержать 12 символов');
      return;
    }

    const payload = {
      content: editContent.trim(),
      education: editEducation?.value || '',
      phone_number: cleanedPhoneNumber
    };
    console.log('Data sent to server:', payload);

    try {
      const response = await axios.patch(
        `http://localhost:8000/api/resume/${resumeToEdit}/edit/`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Response data:', response.data);
      setResumes(resumes.map(resume =>
        resume.id === resumeToEdit ? response.data : resume
      ));
      toast.success('Резюме успешно обновлено!');
      handleCloseEditModal();
    } catch (err) {
      const errorMsg = err.response?.data?.content || err.response?.data?.phone_number || err.response?.data?.education || err.response?.data?.error || 'Ошибка при обновлении резюме';
      console.error('Error:', err.response?.data);
      toast.error(errorMsg);
      setError(errorMsg);
    }
  };

  const handleOpenViewModal = (resume) => {
    setResumeToView(resume);
    setStatusComment('');
    setShowViewModal(true);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setResumeToView(null);
    setStatusComment('');
  };

  const handleStatusUpdate = async (resumeId, newStatus) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.patch(
        `http://localhost:8000/api/resume/${resumeId}/status/`,
        { status: newStatus, comment: statusComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResumes(resumes.map(resume =>
        resume.id === resumeId ? { ...resume, status: response.data.status, comment: response.data.comment } : resume
      ));
      toast.success(`Статус резюме обновлён: ${newStatus}`);
      handleCloseViewModal();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Ошибка при обновлении статуса';
      toast.error(errorMsg);
      setError(errorMsg);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Личный кабинет</h1>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card mb-4">
        <h2 className="card-header">{user.isStaff ? 'Все резюме' : 'Ваши резюме'}</h2>
        <div className="card-body">
          {resumes.length === 0 ? (
            <p>{user.isStaff ? 'Резюме отсутствуют.' : 'У вас пока нет резюме.'}</p>
          ) : (
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Кандидат</th>
                  <th>Содержание</th>
                  <th>Образование</th>
                  <th>Телефон</th>
                  <th>Статус</th>
                  <th>Дата создания</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {resumes.map(resume => (
                  <tr key={resume.id}>
                    <td>
                      {resume.candidate?.user
                        ? `${resume.candidate.user.last_name || ''} ${resume.candidate.user.first_name || ''} ${resume.candidate.user.patronymic || ''}`.trim()
                        : 'Кандидат не указан'}
                    </td>
                    <td>{resume.content.substring(0, 50)}...</td>
                    <td>{resume.education_display || 'Не указано'}</td>
                    <td>{resume.phone_number || 'Не указан'}</td>
                    <td>{resume.status_display}</td>
                    <td>{new Date(resume.created_at).toLocaleDateString()}</td>
                    <td className="align-middle">
                      <div className="d-flex align-items-center gap-2">
                        <button
                          className="btn btn-square btn-primary"
                          onClick={() => handleOpenViewModal(resume)}
                          title="Просмотреть резюме"
                        >
                          <FaEye />
                        </button>
                        {!user.isStaff && (
                          <>
                            {resume.status !== 'ACCEPTED' && (
                              <>
                                <button
                                  className="btn btn-square btn-edit"
                                  onClick={() => handleOpenEditModal(resume)}
                                  title="Редактировать резюме"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  className="btn btn-square btn-danger"
                                  onClick={() => handleOpenDeleteModal(resume.id)}
                                  title="Удалить резюме"
                                >
                                  <FaTrash />
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {!user.isStaff && (
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
              <div className="mb-3">
                <label htmlFor="education" className="form-label">Образование</label>
                <Select
                  id="education"
                  options={educationOptions}
                  value={education}
                  onChange={setEducation}
                  placeholder="Выберите образование"
                  isClearable
                />
              </div>
              <div className="mb-3">
                <label htmlFor="phoneNumber" className="form-label">Номер телефона</label>
                <IMaskInput
                  mask="+7(000) 000-00-00"
                  className="form-control"
                  id="phoneNumber"
                  value={phoneNumber}
                  onAccept={(value) => setPhoneNumber(value)}
                  placeholder="+7(___) ___-__-__"
                />
              </div>
              <button type="submit" className="btn btn-primary">Отправить резюме</button>
            </form>
          </div>
        </div>
      )}

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
              <button type="button" className="btn btn-action btn-secondary" onClick={handleCloseDeleteModal}>
                Отмена
              </button>
              <button type="button" className="btn btn-action btn-danger" onClick={handleDeleteResume}>
                Удалить
              </button>
            </div>
          </div>
        </div>
      </div>
      {showDeleteModal && <div className="modal-backdrop fade show"></div>}

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
                <div className="mb-3">
                  <label htmlFor="editEducation" className="form-label">Образование</label>
                  <Select
                    id="editEducation"
                    options={educationOptions}
                    value={editEducation}
                    onChange={setEditEducation}
                    placeholder="Выберите образование"
                    isClearable
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="editPhoneNumber" className="form-label">Номер телефона</label>
                  <IMaskInput
                    mask="+7(000) 000-00-00"
                    className="form-control"
                    id="editPhoneNumber"
                    value={editPhoneNumber}
                    onAccept={(value) => setEditPhoneNumber(value)}
                    placeholder="+7(___) ___-__-__"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-action btn-secondary" onClick={handleCloseEditModal}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-action btn-primary">
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {showEditModal && <div className="modal-backdrop fade show"></div>}

      <div className={`modal fade ${showViewModal ? 'show' : ''}`} style={{ display: showViewModal ? 'block' : 'none' }} tabIndex="-1">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Просмотр резюме</h5>
              <button type="button" className="btn-close" onClick={handleCloseViewModal}></button>
            </div>
            <div className="modal-body">
              {resumeToView && (
                <>
                  <h6>Кандидат: {resumeToView.candidate?.user.last_name} {resumeToView.candidate?.user.first_name} {resumeToView.candidate?.user.patronymic}</h6>
                  <p><strong>Email:</strong> {resumeToView.candidate?.user.email}</p>
                  <p><strong>Образование:</strong> {resumeToView.education_display || 'Не указано'}</p>
                  <p><strong>Номер телефона:</strong> {resumeToView.phone_number || 'Не указан'}</p>
                  <p><strong>Дата создания:</strong> {new Date(resumeToView.created_at).toLocaleString()}</p>
                  <p><strong>Содержание:</strong></p>
                  <div className="border p-3 bg-light" style={{ whiteSpace: 'pre-wrap' }}>
                    {resumeToView.content}
                  </div>
                  {(resumeToView.status === 'ACCEPTED' || resumeToView.status === 'REJECTED') && resumeToView.comment && (
                    <div className="mt-3">
                      <p><strong>Комментарий модератора:</strong></p>
                      <div className="border p-3 bg-light" style={{ whiteSpace: 'pre-wrap' }}>
                        {resumeToView.comment}
                      </div>
                    </div>
                  )}
                  {user.isStaff && resumeToView.status === 'PENDING' && (
                    <div className="mt-3">
                      <label htmlFor="statusComment" className="form-label">Комментарий к статусу</label>
                      <textarea
                        className="form-control"
                        id="statusComment"
                        rows="3"
                        value={statusComment}
                        onChange={(e) => setStatusComment(e.target.value)}
                        placeholder="Введите комментарий (например, рекомендации по улучшению резюме)"
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
              {user.isStaff && resumeToView?.status === 'PENDING' && (
                <>
                  <button
                    className="btn btn-action btn-success"
                    onClick={() => handleStatusUpdate(resumeToView.id, 'ACCEPTED')}
                  >
                    Принять
                  </button>
                  <button
                    className="btn btn-action btn-danger"
                    onClick={() => handleStatusUpdate(resumeToView.id, 'REJECTED')}
                  >
                    Отклонить
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

export default ResumePage;