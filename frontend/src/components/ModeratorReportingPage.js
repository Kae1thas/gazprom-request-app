import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from './AuthContext';
import { Navigate } from 'react-router-dom';
import {
  Table, TableBody, TableCell, TableHead, TableRow, Tabs, Tab, TextField, FormControl, InputLabel, Select, MenuItem, Box
} from '@mui/material';
import { CSVLink } from 'react-csv';
import { Download } from '@mui/icons-material';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const ModeratorReportingPage = () => {
  const { user, loading } = useContext(AuthContext);
  const [resumes, setResumes] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('JOB');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [interviewStatus, setInterviewStatus] = useState('');
  const [interviewResult, setInterviewResult] = useState('');
  const [documentStatus, setDocumentStatus] = useState('');
  const [jobType, setJobType] = useState('');
  const [practiceType, setPracticeType] = useState('');

  const jobTypeOrder = {
    'PROGRAMMER': 'Инженер-программист',
    'METHODOLOGIST': 'Методолог',
    'SPECIALIST': 'Специалист',
    '': 'Не указан',
    null: 'Не указан'
  };

  const practiceTypeOrder = {
    'PRE_DIPLOMA': 'Преддипломная',
    'PRODUCTION': 'Производственная',
    'EDUCATIONAL': 'Учебная',
    '': 'Не указан',
    null: 'Не указан'
  };

  useEffect(() => {
    if (loading || !user?.isStaff) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Токен авторизации отсутствует');
      return;
    }

    const fetchData = async () => {
      try {
        const [resumesResponse, interviewsResponse, documentsResponse] = await Promise.all([
          axios.get('http://localhost:8000/api/resumes/', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:8000/api/interviews/', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:8000/api/documents/', {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);
        setResumes(resumesResponse.data);
        setInterviews(interviewsResponse.data);
        setDocuments(documentsResponse.data);

        const hasJobData = resumesResponse.data.some((r) => r.resume_type === 'JOB') || interviewsResponse.data.some((i) => i.resume_type === 'JOB');
        const hasPracticeData = resumesResponse.data.some((r) => r.resume_type === 'PRACTICE') || interviewsResponse.data.some((i) => i.resume_type === 'PRACTICE');
        if (hasJobData) {
          setActiveTab('JOB');
        } else if (hasPracticeData) {
          setActiveTab('PRACTICE');
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Не удалось загрузить данные');
        toast.error(error);
      }
    };
    fetchData();
  }, [user, loading]);

  const filteredData = useMemo(() => {
    let filteredResumes = resumes.filter((resume) => resume.resume_type === activeTab);
    let filteredInterviews = interviews.filter((interview) => interview.resume_type === activeTab);
    let filteredDocuments = documents;

    if (searchQuery) {
      filteredResumes = filteredResumes.filter((resume) =>
        `${resume.candidate?.user?.last_name || ''} ${resume.candidate?.user?.first_name || ''} ${resume.candidate?.user?.patronymic || ''}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
      filteredInterviews = filteredInterviews.filter((interview) =>
        `${interview.candidate?.user?.last_name || ''} ${interview.candidate?.user?.first_name || ''} ${interview.candidate?.user?.patronymic || ''}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
      filteredDocuments = filteredDocuments.filter((doc) =>
        `${doc.interview?.candidate?.user?.last_name || ''} ${doc.interview?.candidate?.user?.first_name || ''} ${doc.interview?.candidate?.user?.patronymic || ''}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filteredResumes = filteredResumes.filter((resume) => new Date(resume.created_at) >= fromDate);
      filteredInterviews = filteredInterviews.filter((interview) => new Date(interview.scheduled_at) >= fromDate);
      filteredDocuments = filteredDocuments.filter((doc) => new Date(doc.uploaded_at) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filteredResumes = filteredResumes.filter((resume) => new Date(resume.created_at) <= toDate);
      filteredInterviews = filteredInterviews.filter((interview) => new Date(interview.scheduled_at) <= toDate);
      filteredDocuments = filteredDocuments.filter((doc) => new Date(doc.uploaded_at) <= toDate);
    }

    if (interviewStatus) {
      filteredInterviews = filteredInterviews.filter((interview) => interview.status === interviewStatus);
    }

    if (interviewResult) {
      filteredInterviews = filteredInterviews.filter((interview) => interview.result === interviewResult);
    }

    if (documentStatus) {
      filteredDocuments = filteredDocuments.filter((doc) => doc.status === documentStatus);
    }

    if (activeTab === 'JOB' && jobType) {
      filteredResumes = filteredResumes.filter((resume) => resume.job_type === jobType);
      filteredInterviews = filteredInterviews.filter((interview) => interview.job_type === jobType);
      filteredDocuments = filteredDocuments.filter((doc) => doc.interview?.job_type === jobType);
    } else if (activeTab === 'PRACTICE' && practiceType) {
      filteredResumes = filteredResumes.filter((resume) => resume.practice_type === practiceType);
      filteredInterviews = filteredInterviews.filter((interview) => interview.practice_type === practiceType);
      filteredDocuments = filteredDocuments.filter((doc) => doc.interview?.practice_type === practiceType);
    }

    return { filteredResumes, filteredInterviews, filteredDocuments };
  }, [resumes, interviews, documents, activeTab, searchQuery, dateFrom, dateTo, interviewStatus, interviewResult, documentStatus, jobType, practiceType]);

  const csvData = useMemo(() => {
    const { filteredResumes, filteredInterviews, filteredDocuments } = filteredData;
    const data = [];

    filteredResumes.forEach((resume) => {
      const candidateName = `${resume.candidate?.user?.last_name || ''} ${resume.candidate?.user?.first_name || ''} ${resume.candidate?.user?.patronymic || ''}`.trim();
      const interview = filteredInterviews.find((i) => i.candidate?.id === resume.candidate?.id && i.resume_type === resume.resume_type);
      const relatedDocs = filteredDocuments.filter((doc) => doc.interview?.candidate?.id === resume.candidate?.id && doc.interview?.resume_type === resume.resume_type);

      data.push({
        candidate: candidateName,
        resume_type: resume.resume_type === 'JOB' ? 'Работа' : 'Практика',
        job_type: resume.resume_type === 'JOB' ? jobTypeOrder[resume.job_type] || 'Не указан' : '',
        practice_type: resume.resume_type === 'PRACTICE' ? practiceTypeOrder[resume.practice_type] || 'Не указан' : '',
        resume_status: resume.status_display,
        resume_date: new Date(resume.created_at).toLocaleDateString('ru-RU'),
        interview_status: interview ? {
          SCHEDULED: 'Запланировано',
          COMPLETED: 'Проведено',
          CANCELLED: 'Отменено'
        }[interview.status] || 'Нет' : 'Нет',
        interview_result: interview ? {
          SUCCESS: 'Успешно',
          FAILURE: 'Неуспешно',
          PENDING: 'Ожидает'
        }[interview.result] || 'Нет' : 'Нет',
        interview_date: interview ? new Date(interview.scheduled_at).toLocaleString('ru-RU') : 'Нет',
        documents: relatedDocs.map((doc) => `${doc.document_type} (${doc.status_display})`).join('; ') || 'Нет'
      });
    });

    return data;
  }, [filteredData]);

  const chartData = useMemo(() => {
    const { filteredResumes, filteredInterviews } = filteredData;

    const resumeStats = {};
    const interviewStats = { SUCCESS: 0, FAILURE: 0, PENDING: 0, CANCELLED: 0 };

    filteredResumes.forEach((resume) => {
      const key = resume.resume_type === 'JOB' ? resume.job_type : resume.practice_type;
      resumeStats[key] = (resumeStats[key] || 0) + 1;
    });

    filteredInterviews.forEach((interview) => {
      if (interview.status === 'CANCELLED') {
        interviewStats.CANCELLED += 1;
      } else {
        interviewStats[interview.result] = (interviewStats[interview.result] || 0) + 1;
      }
    });

    return {
      resumeChart: {
        labels: Object.keys(resumeStats).map((key) => activeTab === 'JOB' ? jobTypeOrder[key] || 'Не указан' : practiceTypeOrder[key] || 'Не указан'),
        datasets: [{
          label: 'Количество резюме',
          data: Object.values(resumeStats),
          backgroundColor: ['#0079c0', '#16a34a', '#dc2626', '#6b7280'],
        }]
      },
      interviewChart: {
        labels: ['Успешно', 'Неуспешно', 'Ожидает', 'Отменено'],
        datasets: [{
          label: 'Статусы собеседований',
          data: [interviewStats.SUCCESS, interviewStats.FAILURE, interviewStats.PENDING, interviewStats.CANCELLED],
          backgroundColor: ['#16a34a', '#dc2626', '#ed6c02', '#6b7280'],
        }]
      }
    };
  }, [filteredData, activeTab]);

  const resumeChartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Количество резюме'
        }
      },
      x: {
        title: {
          display: true,
          text: activeTab === 'JOB' ? 'Тип работы' : 'Тип практики'
        }
      }
    },
    plugins: {
      legend: {
        display: true
      },
      title: {
        display: true,
        text: 'Статистика резюме'
      }
    }
  };

  const interviewChartOptions = {
    plugins: {
      legend: {
        display: true
      },
      title: {
        display: true,
        text: 'Статистика собеседований'
      }
    }
  };

  if (loading) {
    return (
      <Box className="container mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!user.isStaff) {
    return <Box className="container mt-5 alert alert-danger">{error}</Box>;
  }

  const hasJobData = resumes.some((r) => r.resume_type === 'JOB') || interviews.some((i) => i.resume_type === 'JOB');
  const hasPracticeData = resumes.some((r) => r.resume_type === 'PRACTICE') || interviews.some((i) => i.resume_type === 'PRACTICE');

  return (
    <Box className="container mx-auto mt-5 pl-64 pt-20">
      <h1 className="mb-4">Отчетность по кандидатам</h1>
      <p>
        Используйте фильтры для настройки отчета. Данные можно выгрузить в CSV для анализа.
      </p>
      {error && <Box className="alert alert-danger" mb={2}>{error}</Box>}

      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        <TextField
          label="Поиск по имени кандидата"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flex: 1, minWidth: 200 }}
          size="small"
        />
        <TextField
          label="Дата от"
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 200 }}
          size="small"
        />
        <TextField
          label="Дата до"
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 200 }}
          size="small"
        />
        <FormControl variant="outlined" size="small" sx={{ width: 200 }}>
          <InputLabel id="interview-status-label">Статус собеседования</InputLabel>
          <Select
            labelId="interview-status-label"
            value={interviewStatus}
            onChange={(e) => setInterviewStatus(e.target.value)}
            label="Статус собеседования"
          >
            <MenuItem value="">Все</MenuItem>
            <MenuItem value="SCHEDULED">Запланировано</MenuItem>
            <MenuItem value="COMPLETED">Проведено</MenuItem>
            <MenuItem value="CANCELLED">Отменено</MenuItem>
          </Select>
        </FormControl>
        <FormControl variant="outlined" size="small" sx={{ width: 200 }}>
          <InputLabel id="interview-result-label">Результат собеседования</InputLabel>
          <Select
            labelId="interview-result-label"
            value={interviewResult}
            onChange={(e) => setInterviewResult(e.target.value)}
            label="Результат собеседования"
          >
            <MenuItem value="">Все</MenuItem>
            <MenuItem value="SUCCESS">Успешно</MenuItem>
            <MenuItem value="FAILURE">Неуспешно</MenuItem>
            <MenuItem value="PENDING">Ожидает</MenuItem>
          </Select>
        </FormControl>
        {activeTab === 'JOB' && (
          <FormControl variant="outlined" size="small" sx={{ width: 200 }}>
            <InputLabel id="job-type-label">Тип работы</InputLabel>
            <Select
              labelId="job-type-label"
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              label="Тип работы"
            >
              <MenuItem value="">Все</MenuItem>
              <MenuItem value="PROGRAMMER">Инженер-программист</MenuItem>
              <MenuItem value="METHODOLOGIST">Методолог</MenuItem>
              <MenuItem value="SPECIALIST">Специалист</MenuItem>
            </Select>
          </FormControl>
        )}
        {activeTab === 'PRACTICE' && (
          <FormControl variant="outlined" size="small" sx={{ width: 200 }}>
            <InputLabel id="practice-type-label">Тип практики</InputLabel>
            <Select
              labelId="practice-type-label"
              value={practiceType}
              onChange={(e) => setPracticeType(e.target.value)}
              label="Тип практики"
            >
              <MenuItem value="">Все</MenuItem>
              <MenuItem value="PRE_DIPLOMA">Преддипломная</MenuItem>
              <MenuItem value="PRODUCTION">Производственная</MenuItem>
              <MenuItem value="EDUCATIONAL">Учебная</MenuItem>
            </Select>
          </FormControl>
        )}
      </Box>

      <Box sx={{ mb: 4 }}>
        <CSVLink
          data={csvData}
          filename={`report_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`}
          className="btn btn-primary"
          target="_blank"
        >
          <Download sx={{ mr: 1 }} />
          Экспорт в CSV
        </CSVLink>
      </Box>

      {(hasJobData || hasPracticeData) ? (
        <>
          <Tabs
            value={activeTab}
            onChange={(event, newValue) => setActiveTab(newValue)}
            aria-label="Отчетность по типу"
          >
            {hasJobData && <Tab label="Работа" value="JOB" />}
            {hasPracticeData && <Tab label="Практика" value="PRACTICE" />}
          </Tabs>
          <Box sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 4, mb: 4, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, maxWidth: 500, minWidth: 300 }}>
                <Bar data={chartData.resumeChart} options={resumeChartOptions} />
              </Box>
              <Box sx={{ flex: 1, maxWidth: 500, minWidth: 300 }}>
                <Pie data={chartData.interviewChart} options={interviewChartOptions} />
              </Box>
            </Box>
            <Box className="card mb-4">
              <h2 className="card-header">Отчет по кандидатам</h2>
              <div className="card-body">
                {filteredData.filteredResumes.length === 0 ? (
                  <p>Резюме отсутствуют.</p>
                ) : (
                  <Table className="table table-striped">
                    <TableHead>
                      <TableRow>
                        <TableCell>Кандидат</TableCell>
                        <TableCell>{activeTab === 'JOB' ? 'Тип работы' : 'Тип практики'}</TableCell>
                        <TableCell>Статус резюме</TableCell>
                        <TableCell>Дата подачи</TableCell>
                        <TableCell>Статус собеседования</TableCell>
                        <TableCell>Результат</TableCell>
                        <TableCell>Дата собеседования</TableCell>
                        <TableCell>Документы</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredData.filteredResumes.map((resume) => {
                        const interview = filteredData.filteredInterviews.find(
                          (i) => i.candidate?.id === resume.candidate?.id && i.resume_type === resume.resume_type
                        );
                        const relatedDocs = filteredData.filteredDocuments.filter(
                          (doc) => doc.interview?.candidate?.id === resume.candidate?.id && doc.interview?.resume_type === resume.resume_type
                        );
                        return (
                          <TableRow key={resume.id}>
                            <TableCell>
                              {resume.candidate?.user
                                ? `${resume.candidate.user.last_name || ''} ${resume.candidate.user.first_name || ''} ${resume.candidate.user.patronymic || ''}`.trim()
                                : 'Кандидат не указан'}
                            </TableCell>
                            <TableCell>
                              {activeTab === 'JOB'
                                ? jobTypeOrder[resume.job_type] || 'Не указан'
                                : practiceTypeOrder[resume.practice_type] || 'Не указан'}
                            </TableCell>
                            <TableCell>{resume.status_display}</TableCell>
                            <TableCell>{new Date(resume.created_at).toLocaleDateString('ru-RU')}</TableCell>
                            <TableCell>
                              {interview ? {
                                SCHEDULED: 'Запланировано',
                                COMPLETED: 'Проведено',
                                CANCELLED: 'Отменено'
                              }[interview.status] || 'Нет' : 'Нет'}
                            </TableCell>
                            <TableCell>
                              {interview ? {
                                SUCCESS: 'Успешно',
                                FAILURE: 'Неуспешно',
                                PENDING: 'Ожидает'
                              }[interview.result] || 'Нет' : 'Нет'}
                            </TableCell>
                            <TableCell>
                              {interview ? new Date(interview.scheduled_at).toLocaleString('ru-RU') : 'Нет'}
                            </TableCell>
                            <TableCell>
                              {relatedDocs.length > 0
                                ? relatedDocs.map((doc) => `${doc.document_type} (${doc.status_display})`).join('; ')
                                : 'Нет'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </Box>
          </Box>
        </>
      ) : (
        <Box className="card mb-4">
          <div className="card-body">
            <p>Данные отсутствуют.</p>
          </div>
        </Box>
      )}
    </Box>
  );
};

export default ModeratorReportingPage;