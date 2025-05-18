import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from './AuthContext';
import { Navigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableRow, Tabs, Tab, Box, Typography } from '@mui/material';
import InterviewModal from './InterviewModal';

const practiceTypeDisplayMap = {
  PRE_DIPLOMA: 'Преддипломная',
  PRODUCTION: 'Производственная',
  EDUCATIONAL: 'Учебная',
  '': '-',
  null: '-'
};

const InterviewPage = () => {
  const { user, loading } = useContext(AuthContext);
  const [interviews, setInterviews] = useState([]);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('JOB');

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
        const response = await axios.get('http://localhost:8000/api/interviews/my/', {
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

  const renderInterviewTable = (interviewType) => {
    const interviewsToShow = interviewType === 'JOB'
      ? interviews.filter((interview) => interview.resume_type === 'JOB')
      : interviews.filter((interview) => interview.resume_type === 'PRACTICE');
    const isPractice = interviewType === 'PRACTICE';

    return (
      <div className="card mb-4">
        <h2 className="card-header">
          Ваши собеседования на {isPractice ? 'практику' : 'работу'}
        </h2>
        <div className="card-body">
          {interviewsToShow.length === 0 ? (
            <p>У вас пока нет запланированных собеседований на {isPractice ? 'практику' : 'работу'}.</p>
          ) : (
            <Table className="table table-striped">
              <TableHead>
                <TableRow>
                  <TableCell>Кандидат</TableCell>
                  <TableCell>Сотрудник</TableCell>
                  {isPractice ? (
                    <TableCell>Тип практики</TableCell>
                  ) : (
                    <TableCell>Тип работы</TableCell>
                  )}
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
                    <TableCell>
                      {isPractice
                        ? interview.practice_type_display || practiceTypeDisplayMap[interview.practice_type] || '-'
                        : interview.job_type_display || '-'}
                    </TableCell>
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
                        isModerator={false}
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

  const hasJobInterviews = interviews.some((interview) => interview.resume_type === 'JOB');
  const hasPracticeInterviews = interviews.some((interview) => interview.resume_type === 'PRACTICE');

  return (
    <Box className="container mt-5">
      <Typography variant="h4" sx={{ textAlign: 'center', mb: 4 }}>
        Собеседования
      </Typography>
      {error && (
        <div className="alert alert-danger" mb={2}>
          {error}
        </div>
      )}

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
            <p>У вас пока нет запланированных собеседований.</p>
          </div>
        </div>
      )}
    </Box>
  );
};

export default InterviewPage;