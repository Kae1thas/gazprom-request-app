import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Modal, Box, Typography, Button, TextField } from '@mui/material';
import { FaEye } from 'react-icons/fa';
import ReactSelect from 'react-select';

const resumeTypeOptions = [
  { value: 'JOB', label: 'Работа' },
  { value: 'PRACTICE', label: 'Практика' },
];

const practiceTypeOptions = [
  { value: 'PRE_DIPLOMA', label: 'Преддипломная' },
  { value: 'PRODUCTION', label: 'Производственная' },
  { value: 'EDUCATIONAL', label: 'Учебная' },
];

const practiceTypeDisplayMap = {
  PRE_DIPLOMA: 'Преддипломная',
  PRODUCTION: 'Производственная',
  EDUCATIONAL: 'Учебная',
  '': '-',
  null: '-'
};

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const InterviewModal = ({ mode, interview, interviews, setInterviews, isModerator }) => {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedResumeType, setSelectedResumeType] = useState(null);
  const [selectedPracticeType, setSelectedPracticeType] = useState(null);
  const [scheduledAt, setScheduledAt] = useState('');

  useEffect(() => {
    if (mode === 'create' && open && isModerator) {
      const token = localStorage.getItem('token');
      const fetchData = async () => {
        try {
          const [candidatesResponse, employeesResponse] = await Promise.all([
            axios.get('http://localhost:8000/api/interviews/available_candidates/', {
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get('http://localhost:8000/api/interviews/available_employees/', {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);
          setCandidates(candidatesResponse.data.map((c) => ({
            value: c.id,
            label: `${c.user.last_name} ${c.user.first_name} ${c.user.patronymic} (${c.user.email})`,
          })));
          setEmployees(employeesResponse.data.map((e) => ({
            value: e.id,
            label: `${e.user.last_name} ${e.user.first_name} ${e.user.patronymic} (${e.position})`,
          })));
        } catch (err) {
          const errorMsg = err.response?.data?.error || 'Не удалось загрузить данные';
          setError(errorMsg);
          toast.error(errorMsg);
        }
      };
      fetchData();
    }
  }, [open, mode, isModerator]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setError('');
    setStatusComment('');
    setSelectedCandidate(null);
    setSelectedEmployee(null);
    setSelectedResumeType(null);
    setSelectedPracticeType(null);
    setScheduledAt('');
  };

  const handleCreateInterview = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!selectedCandidate || !selectedEmployee || !scheduledAt || !selectedResumeType) {
      const errorMsg = 'Заполните все обязательные поля';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    if (selectedResumeType?.value === 'PRACTICE' && !selectedPracticeType) {
      const errorMsg = 'Выберите тип практики';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    const payload = {
      candidate: selectedCandidate.value,
      employee: selectedEmployee.value,
      scheduled_at: new Date(scheduledAt).toISOString(),
      resume_type: selectedResumeType.value,
      ...(selectedResumeType?.value === 'PRACTICE' && { practice_type: selectedPracticeType?.value }),
    };

    try {
      const response = await axios.post(
        'http://localhost:8000/api/interviews/create_interview/',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInterviews([...interviews, response.data]);
      toast.success('Собеседование успешно назначено!');
      handleClose();
    } catch (err) {
      const errorMsg = (
        err.response?.data?.non_field_errors ||
        err.response?.data?.scheduled_at ||
        err.response?.data?.candidate ||
        err.response?.data?.employee ||
        err.response?.data?.resume_type ||
        err.response?.data?.practice_type ||
        'Ошибка при назначении собеседования'
      );
      const displayMsg = Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg;
      toast.error(displayMsg);
      setError(displayMsg);
    }
  };

  const handleStatusUpdate = async (newStatus, newResult) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.patch(
        `http://localhost:8000/api/interviews/${interview.id}/`,
        { status: newStatus, result: newResult, comment: statusComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInterviews(
        interviews.map((i) => (i.id === interview.id ? response.data : i))
      );
      toast.success(`Статус собеседования обновлён: ${newStatus}`);
      handleClose();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Ошибка при обновлении статуса';
      toast.error(errorMsg);
      setError(errorMsg);
    }
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const renderViewModal = () => (
    <Box sx={modalStyle}>
      <Typography variant="h6">Просмотр собеседования</Typography>
      {interview ? (
        <>
          <Typography variant="subtitle1">
            Кандидат: {`${interview.candidate?.user.last_name || ''} ${interview.candidate?.user.first_name || ''} ${interview.candidate?.user.patronymic || ''}`.trim()}
          </Typography>
          <Typography><strong>Email:</strong> {interview.candidate?.user.email || 'Не указан'}</Typography>
          <Typography variant="subtitle1">
            Сотрудник: {`${interview.employee?.user.last_name || ''} ${interview.employee?.user.first_name || ''} ${interview.employee?.user.patronymic || ''}`.trim()}
          </Typography>
          <Typography><strong>Должность:</strong> {interview.employee?.position || 'Не указана'}</Typography>
          <Typography><strong>Тип заявки:</strong> {interview.resume_type === 'JOB' ? 'Работа' : 'Практика'}</Typography>
          {interview.resume_type === 'PRACTICE' && (
            <Typography><strong>Тип практики:</strong> {interview.practice_type_display || practiceTypeDisplayMap[interview.practice_type] || '-'}</Typography>
          )}
          <Typography><strong>Дата и время:</strong> {new Date(interview.scheduled_at).toLocaleString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
          })}</Typography>
          <Typography><strong>Статус:</strong> <span className={`badge ${interview.status === 'SCHEDULED' ? 'bg-warning' : interview.status === 'COMPLETED' ? 'bg-success' : 'bg-danger'}`}>
            {interview.status === 'SCHEDULED' ? 'Запланировано' : interview.status === 'COMPLETED' ? 'Проведено' : 'Отменено'}
          </span></Typography>
          <Typography><strong>Результат:</strong> <span className={`badge ${interview.result === 'SUCCESS' ? 'bg-success' : interview.result === 'FAILURE' ? 'bg-danger' : 'bg-warning'}`}>
            {interview.result === 'SUCCESS' ? 'Успешно' : interview.result === 'FAILURE' ? 'Неуспешно' : 'Ожидает'}
          </span></Typography>
          {interview.comment && (
            <Typography><strong>Комментарий:</strong> {interview.comment}</Typography>
          )}
          {isModerator && interview.status === 'SCHEDULED' && (
            <TextField
              label="Комментарий к статусу"
              multiline
              rows={3}
              fullWidth
              value={statusComment}
              onChange={(e) => setStatusComment(e.target.value)}
              placeholder="Введите комментарий"
              sx={{ mt: 2 }}
            />
          )}
        </>
      ) : (
        <Typography>Данные собеседования недоступны</Typography>
      )}
      {error && <div className="alert alert-danger mt-2">{error}</div>}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button variant="contained" color="primary" onClick={handleClose}>
          Закрыть
        </Button>
        {isModerator && interview?.status === 'SCHEDULED' && (
          <>
            <Button
              variant="contained"
              color="success"
              onClick={() => handleStatusUpdate('COMPLETED', 'SUCCESS')}
            >
              Успешно завершено
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => handleStatusUpdate('COMPLETED', 'FAILURE')}
            >
              Неуспешно завершено
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleStatusUpdate('CANCELLED', 'PENDING')}
            >
              Отменить
            </Button>
          </>
        )}
      </Box>
    </Box>
  );

  const renderCreateModal = () => (
    <Box sx={modalStyle}>
      <Typography variant="h6">Назначить собеседование</Typography>
      <form onSubmit={handleCreateInterview}>
        <div className="mb-3">
          <label htmlFor="candidateSelect" className="form-label">Кандидат</label>
          <ReactSelect
            id="candidateSelect"
            options={candidates}
            value={selectedCandidate}
            onChange={setSelectedCandidate}
            placeholder="Выберите кандидата"
            isClearable
          />
        </div>
        <div className="mb-3">
          <label htmlFor="employeeSelect" className="form-label">Сотрудник</label>
          <ReactSelect
            id="employeeSelect"
            options={employees}
            value={selectedEmployee}
            onChange={setSelectedEmployee}
            placeholder="Выберите сотрудника"
            isClearable
          />
        </div>
        <div className="mb-3">
          <label htmlFor="resumeTypeSelect" className="form-label">Тип заявки</label>
          <ReactSelect
            id="resumeTypeSelect"
            options={resumeTypeOptions}
            value={selectedResumeType}
            onChange={(option) => {
              setSelectedResumeType(option);
              if (option?.value !== 'PRACTICE') setSelectedPracticeType(null);
            }}
            placeholder="Выберите тип заявки"
            isClearable
          />
        </div>
        {selectedResumeType?.value === 'PRACTICE' && (
          <div className="mb-3">
            <label htmlFor="practiceTypeSelect" className="form-label">Тип практики</label>
            <ReactSelect
              id="practiceTypeSelect"
              options={practiceTypeOptions}
              value={selectedPracticeType}
              onChange={setSelectedPracticeType}
              placeholder="Выберите тип практики"
              isClearable
            />
          </div>
        )}
        <div className="mb-3">
          <label htmlFor="scheduledAt" className="form-label">Дата и время</label>
          <input
            type="datetime-local"
            className="form-control"
            id="scheduledAt"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            min={getCurrentDateTime()}
          />
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button variant="contained" color="primary" onClick={handleClose}>
            Отмена
          </Button>
          <Button variant="contained" color="primary" type="submit">
            Назначить
          </Button>
        </Box>
      </form>
    </Box>
  );

  return (
    <>
      {mode === 'view' && (
        <>
          <button
            className="btn btn-square btn-primary"
            onClick={handleOpen}
            title="Просмотреть собеседование"
          >
            <FaEye />
          </button>
          <Modal open={open} onClose={handleClose}>
            {renderViewModal()}
          </Modal>
        </>
      )}
      {mode === 'create' && isModerator && (
        <>
          <Button
            variant="contained"
            color="primary"
            className="mb-3"
            onClick={handleOpen}
          >
            Назначить собеседование
          </Button>
          <Modal open={open} onClose={handleClose}>
            {renderCreateModal()}
          </Modal>
        </>
      )}
    </>
  );
};

export default InterviewModal;