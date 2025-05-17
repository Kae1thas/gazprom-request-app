import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from './AuthContext';
import { Navigate } from 'react-router-dom';
import {
  Table, TableBody, TableCell, TableHead, TableRow, Button, Tabs, Tab, TextField, FormControl, InputLabel, Select, MenuItem, Box, Typography
} from '@mui/material';
import InterviewModal from './InterviewModal';

const ModeratorInterviewPage = () => {
  const { user, loading } = useContext(AuthContext);
  const [interviews, setInterviews] = useState([]);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('JOB');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    if (loading) return;

    if (!user?.isStaff) {
      setError('Доступ только для модераторов');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Токен авторизации отсутствует');
      return;
    }

    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/interviews/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInterviews(response.data);

        const hasJobInterviews = response.data.some((interview) => interview.resume_type === 'JOB');
        const hasPracticeInterviews = response.data.some((interview) => interview.resume_type === 'PRACTICE');
        if (hasJobInterviews) {
          setActiveTab('JOB');
        } else if (hasPracticeInterviews) {
          setActiveTab('PRACTICE');
        }
      } catch (err) {
        const errorMsg = err.response?.data?.error || 'Не удалось загрузить данные';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    };
    fetchData();
  }, [user, loading]);

  const handleUpdateInterviews = (updatedInterviews) => {
    setInterviews(updatedInterviews);
  };

  const filteredInterviews = useMemo(() => {
    let result = activeTab === 'JOB'
      ? interviews.filter((interview) => interview.resume_type === 'JOB')
      : interviews.filter((interview) => interview.resume_type === 'PRACTICE');

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
          Собеседования на {isPractice ? 'практику' : 'работу'}
        </h2>
        <div className="card-body">
          {interviewsToShow.length === 0 ? (
            <p>Собеседования на {isPractice ? 'практику' : 'работу'} отсутствуют.</p>
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
                        ? `${interview.candidate.user.last_name || ''} ${interview.candidate.user.first_name || ''} ${interview.candidate.user.patronymic || ''}`.trim()
                        : 'Кандидат не указан'}
                    </TableCell>
                    <TableCell>
                      {interview.employee?.user
                        ? `${interview.employee.user.last_name || ''} ${interview.employee.user.first_name || ''} ${interview.employee.user.patronymic || ''}`.trim()
                        : 'Сотрудник не указан'}
                    </TableCell>
                    {isPractice && (
                      <TableCell>
                        {interview.practice_type_display || interview.practice_type || '-'}
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
                          interview.status === 'SCHEDULED' ? 'bg-warning' :
                          interview.status === 'COMPLETED' ? 'bg-success' : 'bg-danger'
                        }`}
                      >
                        {interview.status === 'SCHEDULED' ? 'Запланировано' :
                         interview.status === 'COMPLETED' ? 'Проведено' : 'Отменено'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`badge ${
                          interview.result === 'SUCCESS' ? 'bg-success' :
                          interview.result === 'FAILURE' ? 'bg-danger' : 'bg-warning'
                        }`}
                      >
                        {interview.result === 'SUCCESS' ? 'Успешно' :
                         interview.result === 'FAILURE' ? 'Неуспешно' : 'Ожидает'}
                      </span>
                    </TableCell>
                    <TableCell align="center">
                      <InterviewModal
                        mode="view"
                        interview={interview}
                        interviews={interviews}
                        setInterviews={handleUpdateInterviews}
                        isModerator={true}
                      />
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

  if (!user.isStaff) {
    return (
      <div className="container mt-5 alert alert-danger">
        {error}
      </div>
    );
  }

  const hasJobInterviews = interviews.some((interview) => interview.resume_type === 'JOB');
  const hasPracticeInterviews = interviews.some((interview) => interview.resume_type === 'PRACTICE');

  return (
    <Box className="container mt-5 pl-64 pt-20">
      <Typography variant="h4" sx={{ textAlign: 'center', mb: 4 }}>
        Управление собеседованиями
      </Typography>
      {error && (
        <div className="alert alert-danger" mb={2}>
          {error}
        </div>
      )}

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

      <InterviewModal
        mode="create"
        interviews={interviews}
        setInterviews={handleUpdateInterviews}
        isModerator={true}
      />

      {hasJobInterviews || hasPracticeInterviews ? (
        <>
          <Tabs
            value={activeTab}
            onChange={(event, newValue) => setActiveTab(newValue)}
            aria-label="Собеседования по типу"
          >
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
            <p>Собеседования отсутствуют.</p>
          </div>
        </div>
      )}
    </Box>
  );
};

export default ModeratorInterviewPage;