import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from './AuthContext';
import { Navigate } from 'react-router-dom';
import {
  Tabs, Tab, Table, TableBody, TableCell, TableHead, TableRow,
  Box, Typography, TextField, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import ResumeModal from './ResumeModal';

const ModeratorResumePage = () => {
  const { user, loading } = useContext(AuthContext);
  const [resumes, setResumes] = useState([]);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('JOB');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');

  const educationOrder = {
    'SECONDARY': 1,
    'HIGHER': 2,
    'POSTGRADUATE': 3,
    '': 0
  };

  const jobTypeOrder = {
    'PROGRAMMER': 1,
    'METHODOLOGIST': 2,
    'SPECIALIST': 3,
    '': 0,
    null: 0
  };

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

    axios
      .get('http://localhost:8000/api/resumes/', {
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

  const handleUpdateResumes = (updatedResumes) => {
    setResumes(updatedResumes);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const filteredResumes = useMemo(() => {
    let result = [...resumes].filter((resume) => resume.resume_type === activeTab);

    if (searchQuery) {
      result = result.filter((resume) =>
        `${resume.candidate?.user?.last_name || ''} ${resume.candidate?.user?.first_name || ''}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'id') {
        return sortOrder === 'asc' ? a.id - b.id : b.id - a.id;
      } else if (sortBy === 'education') {
        const eduA = educationOrder[a.education || ''] || 0;
        const eduB = educationOrder[b.education || ''] || 0;
        return sortOrder === 'asc' ? eduA - eduB : eduB - eduA;
      } else if (sortBy === 'date') {
        const dateA = new Date(a.created_at || '1970-01-01');
        const dateB = new Date(b.created_at || '1970-01-01');
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortBy === 'job_type' && activeTab === 'JOB') {
        const jobA = jobTypeOrder[a.job_type || ''] || 0;
        const jobB = jobTypeOrder[b.job_type || ''] || 0;
        return sortOrder === 'asc' ? jobA - jobB : jobB - jobA;
      }
      return 0;
    });

    return result;
  }, [resumes, activeTab, searchQuery, sortBy, sortOrder]);

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
    return <div className="container mt-5 alert alert-danger">{error}</div>;
  }

  const hasJobResumes = resumes.some((resume) => resume.resume_type === 'JOB');
  const hasPracticeResumes = resumes.some((resume) => resume.resume_type === 'PRACTICE');

  const renderResumeTable = (resumeType) => {
    const resumesToShow = filteredResumes;
    const isPractice = resumeType === 'PRACTICE';

    return (
      <div className="card mb-4">
        <h2 className="card-header">Резюме на {isPractice ? 'практику' : 'работу'}</h2>
        <div className="card-body">
          {resumesToShow.length === 0 ? (
            <p>Резюме на {isPractice ? 'практику' : 'работу'} отсутствуют.</p>
          ) : (
            <Table className="table table-striped">
              <TableHead>
                <TableRow>
                  <TableCell>Кандидат</TableCell>
                  {isPractice ? (
                    <TableCell>Тип практики</TableCell>
                  ) : (
                    <TableCell>Тип работы</TableCell>
                  )}
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
                    <TableCell>
                      {isPractice
                        ? resume.practice_type_display || '-'
                        : resume.job_type_display || '-'}
                    </TableCell>
                    <TableCell>{resume.content.substring(0, 50)}...</TableCell>
                    <TableCell>{resume.education_display || 'Не указано'}</TableCell>
                    <TableCell>{resume.phone_number || 'Не указан'}</TableCell>
                    <TableCell>{resume.status_display}</TableCell>
                    <TableCell>{new Date(resume.created_at).toLocaleDateString()}</TableCell>
                    <TableCell align="center">
                      <ResumeModal
                        resume={resume}
                        resumes={resumes}
                        setResumes={handleUpdateResumes}
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

  return (
    <Box className="container mx-auto mt-5 pl-64 pt-20">
      <h1 className="mb-4">Управление резюме</h1>
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
            <MenuItem value="id">ID резюме</MenuItem>
            <MenuItem value="education">Образование</MenuItem>
            <MenuItem value="date">Дата создания</MenuItem>
            {activeTab === 'JOB' && <MenuItem value="job_type">Тип работы</MenuItem>}
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

      {(hasJobResumes || hasPracticeResumes) ? (
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
            <p>Резюме отсутствуют.</p>
          </div>
        </div>
      )}
    </Box>
  );
};

export default ModeratorResumePage;