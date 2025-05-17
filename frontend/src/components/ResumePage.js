import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from './AuthContext';
import { Navigate } from 'react-router-dom';
import Select from 'react-select';
import { IMaskInput } from 'react-imask';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';
import { Tabs, Tab, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

const ResumePage = () => {
  const { user, loading } = useContext(AuthContext);
  const [resumes, setResumes] = useState([]);
  const [resumeContent, setResumeContent] = useState('');
  const [education, setEducation] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [resumeType, setResumeType] = useState(null);
  const [practiceType, setPracticeType] = useState(null);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [resumeToEdit, setResumeToEdit] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editEducation, setEditEducation] = useState(null);
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [editResumeType, setEditResumeType] = useState(null);
  const [editPracticeType, setEditPracticeType] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [resumeToView, setResumeToView] = useState(null);
  const [statusComment, setStatusComment] = useState('');
  const [activeTab, setActiveTab] = useState('JOB');

  const educationOptions = [
    { value: 'SECONDARY', label: 'Среднее' },
    { value: 'HIGHER', label: 'Высшее' },
    { value: 'POSTGRADUATE', label: 'Аспирантура' },
  ];

  const resumeTypeOptions = [
    { value: 'JOB', label: 'Работа' },
    { value: 'PRACTICE', label: 'Практика' },
  ];

  const practiceTypeOptions = [
    { value: 'PRE_DIPLOMA', label: 'Преддипломная' },
    { value: 'PRODUCTION', label: 'Производственная' },
    { value: 'EDUCATIONAL', label: 'Учебная' },
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
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setResumes(response.data);
        const hasJobResumes = response.data.some((resume) => resume.resume_type === 'JOB');
        const hasPracticeResumes = response.data.some((resume) => resume.resume_type === 'PRACTICE');
        if (hasJobResumes) {
          setActiveTab('JOB');
        } else if (hasPracticeResumes) {
          setActiveTab('PRACTICE');
        }
      })
      .catch((err) => {
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
    if (!resumeType) {
      setError('Выберите тип заявки');
      return;
    }
    if (resumeType.value === 'PRACTICE' && !practiceType) {
      setError('Выберите тип практики');
      return;
    }

    const cleanedPhoneNumber = phoneNumber ? phoneNumber.replace(/[\s()-]/g, '') : '';
    if (cleanedPhoneNumber && (!cleanedPhoneNumber.startsWith('+7') || cleanedPhoneNumber.length !== 12)) {
      setError('Номер телефона должен начинаться с +7 и содержать 12 символов');
      return;
    }

    const payload = {
      content: resumeContent.trim(),
      education: education?.value || '',
      phone_number: cleanedPhoneNumber,
      resume_type: resumeType?.value || 'JOB',
      ...(resumeType?.value === 'PRACTICE' && { practice_type: practiceType?.value || '' }),
    };

    try {
      const response = await axios.post('http://localhost:8000/api/resume/create/', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResumes([...resumes, response.data]);
      setResumeContent('');
      setEducation(null);
      setPhoneNumber('');
      setResumeType(null);
      // Сохраняем practiceType, если resumeType остался PRACTICE, чтобы поле не очищалось
      if (response.data.resume_type === 'PRACTICE' && response.data.practice_type) {
        setPracticeType(
          practiceTypeOptions.find((opt) => opt.value === response.data.practice_type) || null
        );
      } else {
        setPracticeType(null);
      }
      setError('');
      toast.success('Резюме успешно отправлено!');
      setActiveTab(response.data.resume_type);
    } catch (err) {
      const errorMsg =
        err.response?.data?.content ||
        err.response?.data?.phone_number ||
        err.response?.data?.resume_type ||
        err.response?.data?.practice_type ||
        err.response?.data?.error ||
        'Ошибка при отправке резюме';
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
        headers: { Authorization: `Bearer ${token}` },
      });
      setResumes(resumes.filter((resume) => resume.id !== resumeToDelete));
      toast.success('Резюме успешно удалено!');
      handleCloseDeleteModal();
      const hasJobResumes = resumes.some(
        (resume) => resume.id !== resumeToDelete && resume.resume_type === 'JOB'
      );
      const hasPracticeResumes = resumes.some(
        (resume) => resume.id !== resumeToDelete && resume.resume_type === 'PRACTICE'
      );
      if (activeTab === 'JOB' && !hasJobResumes && hasPracticeResumes) {
        setActiveTab('PRACTICE');
      } else if (activeTab === 'PRACTICE' && !hasPracticeResumes && hasJobResumes) {
        setActiveTab('JOB');
      }
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
    setEditEducation(educationOptions.find((opt) => opt.value === resume.education) || null);
    setEditPhoneNumber(resume.phone_number || '');
    setEditResumeType(resumeTypeOptions.find((opt) => opt.value === resume.resume_type) || null);
    setEditPracticeType(
      resume.practice_type
        ? practiceTypeOptions.find((opt) => opt.value === resume.practice_type) || null
        : null
    );
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setResumeToEdit(null);
    setEditContent('');
    setEditEducation(null);
    setEditPhoneNumber('');
    setEditResumeType(null);
    setEditPracticeType(null);
  };

  const handleEditResume = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!editContent.trim()) {
      setError('Содержание резюме не может быть пустым');
      return;
    }
    if (!editResumeType) {
      setError('Выберите тип заявки');
      return;
    }
    if (editResumeType.value === 'PRACTICE' && !editPracticeType) {
      setError('Выберите тип практики');
      return;
    }

    const cleanedPhoneNumber = editPhoneNumber ? editPhoneNumber.replace(/[\s()-]/g, '') : '';
    if (cleanedPhoneNumber && (!cleanedPhoneNumber.startsWith('+7') || cleanedPhoneNumber.length !== 12)) {
      setError('Номер телефона должен начинаться с +7 и содержать 12 символов');
      return;
    }

    const payload = {
      content: editContent.trim(),
      education: editEducation?.value || '',
      phone_number: cleanedPhoneNumber,
      resume_type: editResumeType?.value || 'JOB',
      ...(editResumeType?.value === 'PRACTICE' && { practice_type: editPracticeType?.value || '' }),
    };

    try {
      const response = await axios.patch(`http://localhost:8000/api/resume/${resumeToEdit}/edit/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResumes(resumes.map((resume) => (resume.id === resumeToEdit ? response.data : resume)));
      toast.success('Резюме успешно обновлено!');
      handleCloseEditModal();
      setActiveTab(response.data.resume_type);
    } catch (err) {
      const errorMsg =
        err.response?.data?.content ||
        err.response?.data?.phone_number ||
        err.response?.data?.resume_type ||
        err.response?.data?.practice_type ||
        err.response?.data?.education ||
        err.response?.data?.error ||
        'Ошибка при обновлении резюме';
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
      setResumes(
        resumes.map((resume) =>
          resume.id === resumeId ? { ...resume, status: response.data.status, comment: response.data.comment } : resume
        )
      );
      toast.success(`Статус резюме обновлён: ${newStatus}`);
      handleCloseViewModal();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Ошибка при обновлении статуса';
      toast.error(errorMsg);
      setError(errorMsg);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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

  const jobResumes = resumes.filter((resume) => resume.resume_type === 'JOB');
  const practiceResumes = resumes.filter((resume) => resume.resume_type === 'PRACTICE');
  const hasJobResumes = jobResumes.length > 0;
  const hasPracticeResumes = practiceResumes.length > 0;

  const renderResumeTable = (resumeType) => {
    const resumesToShow = resumeType === 'JOB' ? jobResumes : practiceResumes;
    const isPractice = resumeType === 'PRACTICE';

    return (
      <div className="card mb-4">
        <h2 className="card-header">
          {user.isStaff
            ? `Резюме на ${isPractice ? 'практику' : 'работу'}`
            : `Ваши резюме на ${isPractice ? 'практику' : 'работу'}`}
        </h2>
        <div className="card-body">
          {resumesToShow.length === 0 ? (
            <p>
              {user.isStaff
                ? `Резюме на ${isPractice ? 'практику' : 'работу'} отсутствуют.`
                : `У вас пока нет резюме на ${isPractice ? 'практику' : 'работу'}.`}
            </p>
          ) : (
            <Table className="table table-striped">
              <TableHead>
                <TableRow>
                  <TableCell>Кандидат</TableCell>
                  {isPractice && <TableCell>Тип практики</TableCell>}
                  <TableCell>Содержание</TableCell>
                  <TableCell>Образование</TableCell>
                  <TableCell>Телефон</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell>Дата создания</TableCell>
                  <TableCell align="center">Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {resumesToShow.map((resume) => (
                  <TableRow key={resume.id}>
                    <TableCell>
                      {resume.candidate?.user
                        ? `${resume.candidate.user.last_name || ''} ${resume.candidate.user.first_name || ''} ${
                            resume.candidate.user.patronymic || ''
                          }`.trim()
                        : 'Кандидат не указан'}
                    </TableCell>
                    {isPractice && <TableCell>{resume.practice_type_display || '-'}</TableCell>}
                    <TableCell>{resume.content.substring(0, 50)}...</TableCell>
                    <TableCell>{resume.education_display || 'Не указано'}</TableCell>
                    <TableCell>{resume.phone_number || 'Не указан'}</TableCell>
                    <TableCell>{resume.status_display}</TableCell>
                    <TableCell>{new Date(resume.created_at).toLocaleDateString()}</TableCell>
                    <TableCell align="center">
                      <div className="d-flex align-items-center gap-2 justify-content-center">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Личный кабинет</h1>
      {error && <div className="alert alert-danger">{error}</div>}

      {hasJobResumes || hasPracticeResumes ? (
        <>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="Резюме по типу">
            {hasJobResumes && <Tab label="Работа" value="JOB" />}
            {hasPracticeResumes && <Tab label="Практика" value="PRACTICE" />}
          </Tabs>
          <div className="mt-4">
            {activeTab === 'JOB' && hasJobResumes && renderResumeTable('JOB')}
            {activeTab === 'PRACTICE' && hasPracticeResumes && renderResumeTable('PRACTICE')}
          </div>
        </>
      ) : (
        <div className="card mb-4">
          <div className="card-body">
            <p>{user.isStaff ? 'Резюме отсутствуют.' : 'У вас пока нет резюме.'}</p>
          </div>
        </div>
      )}

      {!user.isStaff && (
        <div className="card mb-4">
          <h2 className="card-header">Подать резюме</h2>
          <div className="card-body">
            <form onSubmit={handleSubmitResume}>
              <div className="mb-3">
                <label htmlFor="resumeType" className="form-label">Тип заявки</label>
                <Select
                  id="resumeType"
                  options={resumeTypeOptions}
                  value={resumeType}
                  onChange={setResumeType}
                  placeholder="Выберите тип заявки"
                  isClearable
                />
              </div>
              {resumeType?.value === 'PRACTICE' && (
                <div className="mb-3">
                  <label htmlFor="practiceType" className="form-label">Тип практики</label>
                  <Select
                    id="practiceType"
                    options={practiceTypeOptions}
                    value={practiceType}
                    onChange={setPracticeType}
                    placeholder="Выберите тип практики"
                    isClearable
                  />
                </div>
              )}
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
                  <label htmlFor="editResumeType" className="form-label">Тип заявки</label>
                  <Select
                    id="editResumeType"
                    options={resumeTypeOptions}
                    value={editResumeType}
                    onChange={setEditResumeType}
                    placeholder="Выберите тип заявки"
                    isClearable
                  />
                </div>
                {editResumeType?.value === 'PRACTICE' && (
                  <div className="mb-3">
                    <label htmlFor="editPracticeType" className="form-label">Тип практики</label>
                    <Select
                      id="editPracticeType"
                      options={practiceTypeOptions}
                      value={editPracticeType}
                      onChange={setEditPracticeType}
                      placeholder="Выберите тип практики"
                      isClearable
                    />
                  </div>
                )}
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
                  <h6>
                    Кандидат: {resumeToView.candidate?.user.last_name} {resumeToView.candidate?.user.first_name}{' '}
                    {resumeToView.candidate?.user.patronymic}
                  </h6>
                  <p>
                    <strong>Email:</strong> {resumeToView.candidate?.user.email}
                  </p>
                  <p>
                    <strong>Тип заявки:</strong> {resumeToView.resume_type === 'JOB' ? 'Работа' : 'Практика'}
                  </p>
                  {resumeToView.resume_type === 'PRACTICE' && (
                    <p>
                      <strong>Тип практики:</strong> {resumeToView.practice_type_display || '-'}
                    </p>
                  )}
                  <p>
                    <strong>Образование:</strong> {resumeToView.education_display || 'Не указано'}
                  </p>
                  <p>
                    <strong>Номер телефона:</strong> {resumeToView.phone_number || 'Не указан'}
                  </p>
                  <p>
                    <strong>Дата создания:</strong> {new Date(resumeToView.created_at).toLocaleString()}
                  </p>
                  <p>
                    <strong>Содержание:</strong>
                  </p>
                  <div className="border p-3 bg-light" style={{ whiteSpace: 'pre-wrap' }}>
                    {resumeToView.content}
                  </div>
                  {(resumeToView.status === 'ACCEPTED' || resumeToView.status === 'REJECTED') && resumeToView.comment && (
                    <div className="mt-3">
                      <p>
                        <strong>Комментарий модератора:</strong>
                      </p>
                      <div className="border p-3 bg-light" style={{ whiteSpace: 'pre-wrap' }}>
                        {resumeToView.comment}
                      </div>
                    </div>
                  )}
                  {user.isStaff && resumeToView.status === 'PENDING' && (
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