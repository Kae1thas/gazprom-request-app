import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { Card } from '@mui/material';

const FinalStatusPage = () => {
  const { user } = useContext(AuthContext);
  const [resumes, setResumes] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setError('Пожалуйста, войдите, чтобы просмотреть финальный статус');
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Токен авторизации отсутствует');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const resumeResponse = await axios.get('http://localhost:8000/api/resumes/my/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const interviewResponse = await axios.get('http://localhost:8000/api/interviews/my/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const documentResponse = await axios.get('http://localhost:8000/api/documents/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setResumes(resumeResponse.data);
        setInterviews(interviewResponse.data);
        setDocuments(documentResponse.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Не удалось загрузить данные');
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const getFinalStatus = () => {
    const acceptedResume = resumes.find((r) => r.status === 'ACCEPTED');
    const successfulInterview = interviews.find((i) => i.result === 'SUCCESS');
    const allDocumentsAccepted =
      documents.length >= (user.gender === 'MALE' ? 9 : 8) &&
      documents.every((d) => d.status === 'ACCEPTED');

    if (user.employee) {
      return {
        status: 'Принят',
        message: 'Поздравляем! Вы приняты на работу или практику.',
        className: 'bg-success',
      };
    } else if (allDocumentsAccepted) {
      return {
        status: 'Ожидание подтверждения',
        message: 'Все документы приняты, ожидайте подтверждения найма или практики.',
        className: 'bg-warning',
      };
    } else if (successfulInterview) {
      return {
        status: 'Ожидание документов',
        message: 'Вы успешно прошли собеседование. Загрузите необходимые документы.',
        className: 'bg-warning',
      };
    } else if (acceptedResume) {
      return {
        status: 'Ожидание собеседования',
        message: 'Ваше резюме принято, ожидайте назначения собеседования.',
        className: 'bg-warning',
      };
    } else if (resumes.some((r) => r.status === 'REJECTED') || interviews.some((i) => i.result === 'FAILURE')) {
      return {
        status: 'Отклонен',
        message: 'К сожалению, ваше резюме или собеседование были отклонены. Попробуйте снова.',
        className: 'bg-danger',
      };
    } else {
      return {
        status: 'В процессе',
        message: 'Ваши заявки находятся в процессе рассмотрения.',
        className: 'bg-warning',
      };
    }
  };

  if (loading) return <div className="container mt-5">Загрузка...</div>;
  if (error) return <div className="container mt-5 alert alert-danger">{error}</div>;

  const finalStatus = getFinalStatus();

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Финальный статус</h1>
      <Card className="p-3">
        <h5>Ваш статус: <span className={`badge ${finalStatus.className}`}>{finalStatus.status}</span></h5>
        <p>{finalStatus.message}</p>
        {resumes.length > 0 && (
          <>
            <h6 className="mt-3">Ваши резюме:</h6>
            <ul>
              {resumes.map((resume) => (
                <li key={resume.id}>
                  Резюме #{resume.id} - Тип: {resume.resume_type === 'JOB' ? 'Работа' : `Практика (${resume.practice_type_display || '-'})`} - Статус: {resume.status_display}
                  {resume.comment && <span> (Комментарий: {resume.comment})</span>}
                </li>
              ))}
            </ul>
          </>
        )}
        {interviews.length > 0 && (
          <>
            <h6 className="mt-3">Ваши собеседования:</h6>
            <ul>
              {interviews.map((interview) => (
                <li key={interview.id}>
                  Собеседование #{interview.id} - {new Date(interview.scheduled_at).toLocaleString()} - Результат:{' '}
                  {interview.result === 'SUCCESS'
                    ? 'Успешно'
                    : interview.result === 'FAILURE'
                    ? 'Неуспешно'
                    : 'Ожидает'}
                </li>
              ))}
            </ul>
          </>
        )}
        {documents.length > 0 && (
          <>
            <h6 className="mt-3">Ваши документы:</h6>
            <ul>
              {documents.map((doc) => (
                <li key={doc.id}>
                  Документ #{doc.id} - Тип: {doc.document_type} - Статус: {doc.status_display}
                  {doc.comment && <span> (Комментарий: {doc.comment})</span>}
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  );
};

export default FinalStatusPage;