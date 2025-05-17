import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from './AuthContext';
import { Navigate } from 'react-router-dom';
import {
  Button, Tabs, Tab, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Select, MenuItem, FormControl, InputLabel, Box, Typography
} from '@mui/material';
import { FaEye } from 'react-icons/fa';
import ReactSelect from 'react-select';

const InterviewPage = () => {
  const { user, loading, fetchUser } = useContext(AuthContext);
  const [interviews, setInterviews] = useState([]);
  const [error, setError] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [interviewToView, setInterviewToView] = useState(null);
  const [statusComment, setStatusComment] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedResumeType, setSelectedResumeType] = useState(null);
  const [selectedPracticeType, setSelectedPracticeType] = useState(null);
  const [scheduledAt, setScheduledAt] = useState('');
  const [activeTab, setActiveTab] = useState('JOB');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');

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
    'PRE_DIPLOMA': 'Преддипломная',
    'PRODUCTION': 'Производственная',
    'EDUCATIONAL': 'Учебная',
    '': '-',
    null: '-'
  };

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setError('Пожалуйста, войдите, чтобы просмотреть собеседования');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Токен авторизации отсутствует');
      return;
    }

    const fetchData = async () => {
      try {
        const interviewUrl = user.isStaff ? 'http://localhost:8000/api/interviews/' : 'http://localhost:8000/api/interviews/my/';
        const interviewResponse = await axios.get(interviewUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInterviews(interviewResponse.data);

        const hasJobInterviews = interviewResponse.data.some((interview) => interview.resume_type === 'JOB');
        const hasPracticeInterviews = interviewResponse.data.some((interview) => interview.resume_type === 'PRACTICE');
        if (hasJobInterviews) {
          setActiveTab('JOB');
        } else if (hasPracticeInterviews) {
          setActiveTab('PRACTICE');
        }

        if (user.isStaff) {
          const [candidatesResponse, employeesResponse] = await Promise.all([
            axios.get('http://localhost:8000/api/interviews/available_candidates/', {
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get('http://localhost:8000/api/interviews/available_employees/', {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);
          setCandidates(candidatesResponse.data.map(c => ({
            value: c.id,
            label: `${c.user.last_name} ${c.user.first_name} ${c.user.patronymic} (${c.user.email})`
          })));
          setEmployees(employeesResponse.data.map(e => ({
            value: e.id,
            label: `${e.user.last_name} ${e.user.first_name} ${e.user.patronymic} (${e.position})`
          })));
        }
      } catch (err) {
        const errorMsg = err.response?.data?.error || 'Не удалось загрузить данные';
        setError(errorMsg);
      }
    };
    fetchData();
  }, [user, loading]);

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

  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
    setSelectedCandidate(null);
    setSelectedEmployee(null);
    setSelectedResumeType(null);
    setSelectedPracticeType(null);
    setScheduledAt('');
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
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
      handleCloseCreateModal();
      setActiveTab(response.data.resume_type);
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
      await fetchUser();
      handleCloseViewModal();
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

  const jobInterviews = interviews.filter((interview) => interview.resume_type === 'JOB');
  const practiceInterviews = interviews.filter((interview) => interview.resume_type === 'PRACTICE');
  const hasJobInterviews = jobInterviews.length > 0;
  const hasPracticeInterviews = practiceInterviews.length > 0;

  const filteredInterviews = useMemo(() => {
    let result = activeTab === 'JOB' ? [...jobInterviews] : [...practiceInterviews];

    if (searchQuery) {
      result = result.filter((interview) =>
        `${interview.candidate.user.last_name} ${interview.candidate.user.first_name}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'id') {
        return sortOrder === 'asc' ? a.id - b.id : b.id - a.id;
      } else if (sortBy === 'name') {
        const nameA = `${a.candidate.user.last_name} ${a.candidate.user.first_name}`.toLowerCase();
        const nameB = `${b.candidate.user.last_name} ${b.candidate.user.first_name}`.toLowerCase();
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      } else if (sortBy === 'date') {
        const dateA = new Date(a.scheduled_at || '1970-01-01');
        const dateB = new Date(b.scheduled_at || '1970-01-01');
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });

    return result;
  }, [interviews, searchQuery, sortBy, sortOrder, activeTab]);

  const renderInterviewTable = (interviewType) => {
    const interviewsToShow = filteredInterviews;
    const isPractice = interviewType === 'PRACTICE';

    return (
      <div className="card mb-4">
        <h2 className="card-header">
          {user.isStaff
            ? `Собеседования на ${isPractice ? 'практику' : 'работу'}`
            : `Ваши собеседования на ${isPractice ? 'практику' : 'работу'}`}
        </h2>
        <div className="card-body">
          {interviewsToShow.length === 0 ? (
            <p>
              {user.isStaff
                ? `Собеседования на ${isPractice ? 'практику' : 'работу'} отсутствуют.`
                : `У вас пока нет запланированных собеседований на ${isPractice ? 'практику' : 'работу'}.`}
            </p>
          ) : (
            <Table className="table table-striped">
              <TableHead>
                <TableRow>
                  <TableCell>Кандидат</TableCell>
                  <TableCell>Сотрудник</TableCell>
                  {isPractice && <TableCell>Тип практики</TableCell>}
                  <TableCell>Дата и время</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell>Результат</TableCell>
                  <TableCell align="center">Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {interviewsToShow.map((interview) => (
                  <TableRow key={interview.id}>
                    <TableCell>
                      {interview.candidate?.user
                        ? `${interview.candidate.user.last_name || ''} ${interview.candidate.user.first_name || ''} ${
                            interview.candidate.user.patronymic || ''
                          }`.trim()
                        : 'Кандидат не указан'}
                    </TableCell>
                    <TableCell>
                      {interview.employee?.user
                        ? `${interview.employee.user.last_name || ''} ${interview.employee.user.first_name || ''} ${
                            interview.employee.user.patronymic || ''
                          }`.trim()
                        : 'Сотрудник не указан'}
                    </TableCell>
                    {isPractice && (
                      <TableCell>
                        {interview.practice_type_display || practiceTypeDisplayMap[interview.practice_type] || '-'}
                      </TableCell>
                    )}
                    <TableCell>
                      {new Date(interview.scheduled_at).toLocaleString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell align="center">
                      <button
                        className="btn btn-square btn-primary"
                        onClick={() => handleOpenViewModal(interview)}
                        title="Просмотреть собеседование"
                      >
                        <FaEye />
                      </button>
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

  if (loading) {
    return (
      <Box className="container mx-auto mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <Box className="container mx-auto mt-5 pl-64 pt-20">
      <Typography variant="h4" sx={{ textAlign: 'center', mb: 4 }}>Собеседования</Typography>
      {error && <div className="alert alert-danger">{error}</div>}

      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        <TextField
          label="Поиск по имени кандидата"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flex: 1, minWidth: 200 }}
          size="small"
        />
        <FormControl variant="outlined" size="small" sx={{ width: 200 }}>
          <InputLabel id="sort-by-label">Сортировать по</InputLabel>
          <Select
            labelId="sort-by-label"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            label="Сортировать по"
          >
            <MenuItem value="id">ID собеседования</MenuItem>
            <MenuItem value="name">Имя кандидата</MenuItem>
            <MenuItem value="date">Дата собеседования</MenuItem>
          </Select>
        </FormControl>
        <FormControl variant="outlined" size="small" sx={{ width: 200 }}>
          <InputLabel id="sort-order-label">Порядок</InputLabel>
          <Select
            labelId="sort-order-label"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            label="Порядок"
          >
            <MenuItem value="asc">По возрастанию</MenuItem>
            <MenuItem value="desc">По убыванию</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {hasJobInterviews || hasPracticeInterviews ? (
        <>
          <Tabs value={activeTab} onChange={(event, newValue) => setActiveTab(newValue)} aria-label="Собеседования по типу">
            {hasJobInterviews && <Tab label="Трудоустройство" value="JOB" />}
            {hasPracticeInterviews && <Tab label="Учебная практика" value="PRACTICE" />}
          </Tabs>
          <div className="mt-4">
            {activeTab === 'JOB' && hasJobInterviews && renderInterviewTable('JOB')}
            {activeTab === 'PRACTICE' && hasPracticeInterviews && renderInterviewTable('PRACTICE')}
          </div>
        </>
      ) : (
        <div className="card mb-4">
          <div className="card-body">
            <p>{user.isStaff ? 'Собеседования отсутствуют.' : 'У вас пока нет запланированных собеседований.'}</p>
          </div>
        </div>
      )}

      {user.isStaff && (
        <Button
          variant="contained"
          color="primary"
          className="mb-3"
          onClick={handleOpenCreateModal}
        >
          Назначить собеседование
        </Button>
      )}

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
                    <strong>Тип заявки:</strong> {interviewToView.resume_type === 'JOB' ? 'Работа' : 'Практика'}
                  </p>
                  {interviewToView.resume_type === 'PRACTICE' && (
                    <p>
                      <strong>Тип практики:</strong>{' '}
                      {interviewToView.practice_type_display || practiceTypeDisplayMap[interviewToView.practice_type] || '-'}
                    </p>
                  )}
                  <p>
                    <strong>Дата и время:</strong>{' '}
                    {new Date(interviewToView.scheduled_at).toLocaleString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
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
                  {interviewToView.comment && (
                    <p>
                      <strong>Комментарий:</strong> {interviewToView.comment}
                    </p>
                  )}
                  {user.isStaff && interviewToView.status === 'SCHEDULED' && (
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
              {user.isStaff && interviewToView?.status === 'SCHEDULED' && (
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

      <div className={`modal fade ${showCreateModal ? 'show' : ''}`} style={{ display: showCreateModal ? 'block' : 'none' }} tabIndex="-1">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Назначить собеседование</h5>
              <button type="button" className="btn-close" onClick={handleCloseCreateModal}></button>
            </div>
            <form onSubmit={handleCreateInterview}>
              <div className="modal-body">
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
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-action btn-secondary" onClick={handleCloseCreateModal}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-action btn-primary">
                  Назначить
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {showCreateModal && <div className="modal-backdrop fade show"></div>}
    </Box>
  );
};

export default InterviewPage;