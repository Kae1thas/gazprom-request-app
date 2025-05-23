import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from './AuthContext';
import { Navigate } from 'react-router-dom';
import { IMaskInput } from 'react-imask';
import { Tabs, Tab, Table, TableBody, TableCell, TableHead, TableRow, Box, Typography } from '@mui/material';
import Select from 'react-select';
import ResumeModal from './ResumeModal';

const ResumePage = () => {
  const { user, loading } = useContext(AuthContext);
  const [resumes, setResumes] = useState([]);
  const [resumeContent, setResumeContent] = useState('');
  const [education, setEducation] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [resumeType, setResumeType] = useState(null);
  const [practiceType, setPracticeType] = useState(null);
  const [jobType, setJobType] = useState(null);
  const [error, setError] = useState('');
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

  const jobTypeOptions = [
    { value: 'PROGRAMMER', label: 'Инженер-программист' },
    { value: 'METHODOLOGIST', label: 'Методолог' },
    { value: 'SPECIALIST', label: 'Специалист' },
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

    axios
      .get('http://localhost:8000/api/resumes/my/', {
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
    if (resumeType.value === 'JOB' && !jobType) {
      setError('Выберите тип работы');
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
      ...(resumeType?.value === 'JOB' && { job_type: jobType?.value || '' }),
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
      setPracticeType(null);
      setJobType(null);
      setError('');
      toast.success('Резюме успешно отправлено!');
      setActiveTab(response.data.resume_type);
    } catch (err) {
      const errorMsg =
        err.response?.data?.content ||
        err.response?.data?.phone_number ||
        err.response?.data?.resume_type ||
        err.response?.data?.practice_type ||
        err.response?.data?.job_type ||
        err.response?.data?.error ||
        'Ошибка при отправке резюме';
      toast.error(errorMsg);
      setError(errorMsg);
    }
  };

  const handleUpdateResumes = (updatedResumes) => {
    setResumes(updatedResumes);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const renderResumeTable = (resumeType) => {
    const resumesToShow = resumes.filter((resume) => resume.resume_type === resumeType);
    const isPractice = resumeType === 'PRACTICE';

    return (
      <div className="card mb-4">
        <h2 className="card-header">Ваши резюме на {isPractice ? 'практику' : 'работу'}</h2>
        <div className="card-body">
          {resumesToShow.length === 0 ? (
            <p>У вас пока нет резюме на {isPractice ? 'практику' : 'работу'}.</p>
          ) : (
            <Table className="table table-striped">
              <TableHead>
                <TableRow>
                  <TableCell>Содержание</TableCell>
                  {isPractice ? <TableCell>Тип практики</TableCell> : <TableCell>Тип работы</TableCell>}
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
                    <TableCell>{resume.content.substring(0, 50)}...</TableCell>
                    {isPractice ? (
                      <TableCell>{resume.practice_type_display || '-'}</TableCell>
                    ) : (
                      <TableCell>{resume.job_type_display || '-'}</TableCell>
                    )}
                    <TableCell>{resume.education_display || 'Не указано'}</TableCell>
                    <TableCell>{resume.phone_number || 'Не указан'}</TableCell>
                    <TableCell>{resume.status_display}</TableCell>
                    <TableCell>{new Date(resume.created_at).toLocaleDateString()}</TableCell>
                    <TableCell align="center">
                      <ResumeModal
                        resume={resume}
                        resumes={resumes}
                        setResumes={handleUpdateResumes}
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

  const hasJobResumes = resumes.some((resume) => resume.resume_type === 'JOB');
  const hasPracticeResumes = resumes.some((resume) => resume.resume_type === 'PRACTICE');

  return (
    <Box className="container mt-5">
      <h1 className="mb-4">Мои резюме</h1>
      <p>Загружайте и управляйте резюме для эффективного завершения процесса подбора персонала или участия в программах стажировки.</p>
      {error && <div className="alert alert-danger">{error}</div>}

      {(hasJobResumes || hasPracticeResumes) && (
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
      )}

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
            {resumeType?.value === 'JOB' && (
              <div className="mb-3">
                <label htmlFor="jobType" className="form-label">Тип работы</label>
                <Select
                  id="jobType"
                  options={jobTypeOptions}
                  value={jobType}
                  onChange={setJobType}
                  placeholder="Выберите тип работы"
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
            {error && <div className="alert alert-danger">{error}</div>}
            <button type="submit" className="btn btn-primary">Отправить резюме</button>
          </form>
        </div>
      </div>
    </Box>
  );
};

export default ResumePage;