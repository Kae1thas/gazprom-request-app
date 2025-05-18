import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { IMaskInput } from 'react-imask';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';
import Select from 'react-select';
import { Modal, Box, Typography, Button, TextField } from '@mui/material';

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

const jobTypeOptions = [
  { value: 'PROGRAMMER', label: 'Инженер-программист' },
  { value: 'METHODOLOGIST', label: 'Методолог' },
  { value: 'SPECIALIST', label: 'Специалист' },
];

const ResumeModal = ({ resume, resumes, setResumes, isModerator }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editContent, setEditContent] = useState(resume.content);
  const [editEducation, setEditEducation] = useState(
    educationOptions.find((opt) => opt.value === resume.education) || null
  );
  const [editPhoneNumber, setEditPhoneNumber] = useState(resume.phone_number || '');
  const [editResumeType, setEditResumeType] = useState(
    resumeTypeOptions.find((opt) => opt.value === resume.resume_type) || null
  );
  const [editPracticeType, setEditPracticeType] = useState(
    resume.practice_type
      ? practiceTypeOptions.find((opt) => opt.value === resume.practice_type) || null
      : null
  );
  const [editJobType, setEditJobType] = useState(
    resume.job_type
      ? jobTypeOptions.find((opt) => opt.value === resume.job_type) || null
      : null
  );
  const [statusComment, setStatusComment] = useState('');
  const [error, setError] = useState('');

  const handleOpenDeleteModal = () => {
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
  };

  const handleDeleteResume = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:8000/api/resume/${resume.id}/delete/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResumes(resumes.filter((r) => r.id !== resume.id));
      toast.success('Резюме успешно удалено!');
      handleCloseDeleteModal();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Ошибка при удалении резюме';
      toast.error(errorMsg);
      setError(errorMsg);
      handleCloseDeleteModal();
    }
  };

  const handleOpenEditModal = () => {
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setError('');
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
    if (editResumeType.value === 'JOB' && !editJobType) {
      setError('Выберите тип работы');
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
      ...(editResumeType?.value === 'JOB' && { job_type: editJobType?.value || '' }),
    };

    try {
      const response = await axios.patch(`http://localhost:8000/api/resume/${resume.id}/edit/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResumes(resumes.map((r) => (r.id === resume.id ? response.data : r)));
      toast.success('Резюме успешно обновлено!');
      handleCloseEditModal();
    } catch (err) {
      const errorMsg =
        err.response?.data?.content ||
        err.response?.data?.phone_number ||
        err.response?.data?.resume_type ||
        err.response?.data?.practice_type ||
        err.response?.data?.job_type ||
        err.response?.data?.education ||
        err.response?.data?.error ||
        'Ошибка при обновлении резюме';
      toast.error(errorMsg);
      setError(errorMsg);
    }
  };

  const handleOpenViewModal = () => {
    setShowViewModal(true);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setStatusComment('');
  };

  const handleStatusUpdate = async (newStatus) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.patch(
        `http://localhost:8000/api/resume/${resume.id}/status/`,
        { status: newStatus, comment: statusComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResumes(
        resumes.map((r) =>
          r.id === resume.id ? { ...r, status: response.data.status, comment: response.data.comment } : r
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

  return (
    <>
      <div className="d-flex align-items-center gap-2 justify-content-center">
        <button
          className="btn btn-square btn-primary"
          onClick={handleOpenViewModal}
          title="Просмотреть резюме"
        >
          <FaEye />
        </button>
        {!isModerator && resume.status !== 'ACCEPTED' && (
          <>
            <button
              className="btn btn-square btn-edit"
              onClick={handleOpenEditModal}
              title="Редактировать резюме"
            >
              <FaEdit />
            </button>
            <button
              className="btn btn-square btn-danger"
              onClick={handleOpenDeleteModal}
              title="Удалить резюме"
            >
              <FaTrash />
            </button>
          </>
        )}
      </div>

      <Modal open={showDeleteModal} onClose={handleCloseDeleteModal}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
        }}>
          <Typography variant="h6">Подтверждение удаления</Typography>
          <Typography sx={{ mt: 2 }}>
            Вы уверены, что хотите удалить это резюме? Это действие нельзя отменить.
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button variant="contained" color="primary" onClick={handleCloseDeleteModal}>
              Отмена
            </Button>
            <Button variant="contained" color="error" onClick={handleDeleteResume}>
              Удалить
            </Button>
          </Box>
        </Box>
      </Modal>

      <Modal open={showEditModal} onClose={handleCloseEditModal}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
        }}>
          <Typography variant="h6">Редактировать резюме</Typography>
          <form onSubmit={handleEditResume}>
            <div className="mb-3">
              <label htmlFor="editResumeType" className="form-label">Тип заявки</label>
              <Select
                id="editResumeType"
                options={resumeTypeOptions}
                value={editResumeType}
                onChange={(option) => {
                  setEditResumeType(option);
                  if (option?.value !== 'PRACTICE') setEditPracticeType(null);
                  if (option?.value !== 'JOB') setEditJobType(null);
                }}
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
            {editResumeType?.value === 'JOB' && (
              <div className="mb-3">
                <label htmlFor="editJobType" className="form-label">Тип работы</label>
                <Select
                  id="editJobType"
                  options={jobTypeOptions}
                  value={editJobType}
                  onChange={setEditJobType}
                  placeholder="Выберите тип работы"
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
            {error && <div className="alert alert-danger">{error}</div>}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button variant="contained" color="primary" onClick={handleCloseEditModal}>
                Отмена
              </Button>
              <Button variant="contained" color="primary" type="submit">
                Сохранить
              </Button>
            </Box>
          </form>
        </Box>
      </Modal>

      <Modal open={showViewModal} onClose={handleCloseViewModal}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 800,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
        }}>
          <Typography variant="h6">Просмотр резюме</Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">
              Кандидат: {resume.candidate?.user.last_name} {resume.candidate?.user.first_name}{' '}
              {resume.candidate?.user.patronymic}
            </Typography>
            <Typography><strong>Email:</strong> {resume.candidate?.user.email}</Typography>
            <Typography><strong>Тип заявки:</strong> {resume.resume_type === 'JOB' ? 'Работа' : 'Практика'}</Typography>
            {resume.resume_type === 'PRACTICE' && (
              <Typography><strong>Тип практики:</strong> {resume.practice_type_display || '-'}</Typography>
            )}
            {resume.resume_type === 'JOB' && (
              <Typography><strong>Тип работы:</strong> {resume.job_type_display || '-'}</Typography>
            )}
            <Typography><strong>Образование:</strong> {resume.education_display || 'Не указано'}</Typography>
            <Typography><strong>Номер телефона:</strong> {resume.phone_number || 'Не указан'}</Typography>
            <Typography><strong>Дата создания:</strong> {new Date(resume.created_at).toLocaleString()}</Typography>
            <Typography sx={{ mt: 2 }}><strong>Содержание:</strong></Typography>
            <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: '4px', bgcolor: '#f5f5f5', whiteSpace: 'pre-wrap' }}>
              {resume.content}
            </Box>
            {(resume.status === 'ACCEPTED' || resume.status === 'REJECTED') && resume.comment && (
              <Box sx={{ mt: 2 }}>
                <Typography><strong>Комментарий модератора:</strong></Typography>
                <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: '4px', bgcolor: '#f5f5f5', whiteSpace: 'pre-wrap' }}>
                  {resume.comment}
                </Box>
              </Box>
            )}
            {isModerator && resume.status === 'PENDING' && (
              <Box sx={{ mt: 2 }}>
                <TextField
                  label="Комментарий к статусу"
                  multiline
                  rows={3}
                  fullWidth
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                  placeholder="Введите комментарий (например, рекомендации по улучшению резюме)"
                />
              </Box>
            )}
          </Box>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button variant="contained" color="primary" onClick={handleCloseViewModal}>
              Закрыть
            </Button>
            {isModerator && resume.status === 'PENDING' && (
              <>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handleStatusUpdate('ACCEPTED')}
                >
                  Принять
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => handleStatusUpdate('REJECTED')}
                >
                  Отклонить
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default ResumeModal;