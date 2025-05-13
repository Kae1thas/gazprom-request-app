import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from './AuthContext';
import { Button, Card, TextField } from '@mui/material';
import { Download, Check, Close } from '@mui/icons-material';

const ModeratorDocumentsPage = () => {
  const { user } = useContext(AuthContext);
  const [interviews, setInterviews] = useState([]);
  const [documents, setDocuments] = useState({});
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.isStaff) {
      setError('Доступ только для модераторов');
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    axios
      .get('http://localhost:8000/api/interviews/', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        const successfulInterviews = response.data.filter((i) => i.result === 'SUCCESS');
        setInterviews(successfulInterviews);
        successfulInterviews.forEach((interview) => {
          axios
            .get(`http://localhost:8000/api/documents/?interview=${interview.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .then((docResponse) => {
              setDocuments((prev) => ({
                ...prev,
                [interview.id]: docResponse.data,
              }));
            });
        });
        setLoading(false);
      })
      .catch(() => {
        setError('Не удалось загрузить данные');
        setLoading(false);
      });
  }, [user]);

  const handleDownload = (fileUrl) => {
    const fullUrl = fileUrl.startsWith('http') ? fileUrl : `http://localhost:8000${fileUrl}`;
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = ''; // Это заставит браузер скачать файл
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStatusUpdate = async (documentId, status) => {
    const token = localStorage.getItem('token');
    const comment = comments[documentId] || '';
    try {
      const response = await axios.patch(
        `http://localhost:8000/api/documents/${documentId}/status/`,
        { status, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Документ #${documentId} обновлен: ${status}`);
      setDocuments((prev) => {
        const updatedDocs = { ...prev };
        Object.keys(updatedDocs).forEach((interviewId) => {
          updatedDocs[interviewId] = updatedDocs[interviewId].map((doc) =>
            doc.id === documentId ? response.data : doc
          );
        });
        return updatedDocs;
      });
    } catch (err) {
      toast.error('Ошибка при обновлении статуса документа');
    }
  };

  const handleConfirmHire = async (interviewId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(
        'http://localhost:8000/api/documents/confirm_hire/',
        { interview_id: interviewId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Кандидат успешно принят на работу!');
      setInterviews((prev) => prev.filter((i) => i.id !== interviewId));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ошибка при подтверждении найма');
    }
  };

  const handleCommentChange = (documentId, value) => {
    setComments((prev) => ({ ...prev, [documentId]: value }));
  };

  if (loading) return <div className="container mt-5">Загрузка...</div>;
  if (error) return <div className="container mt-5 alert alert-danger">{error}</div>;

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Управление документами</h1>
      {interviews.length === 0 ? (
        <p>Нет кандидатов с успешными собеседованиями.</p>
      ) : (
        interviews.map((interview) => (
          <Card key={interview.id} className="p-3 mb-4">
            <h5>
              Собеседование #{interview.id} - Кандидат: {interview.candidate.user.last_name}{' '}
              {interview.candidate.user.first_name}
            </h5>
            <h6 className="mt-3">Документы:</h6>
            {(documents[interview.id] || []).length === 0 ? (
              <p>Документы не загружены.</p>
            ) : (
              <div className="row">
                {documents[interview.id].map((doc) => (
                  <div className="col-md-4 mb-3" key={doc.id}>
                    <Card className="p-3">
                      <p>
                        <strong>Документ #{doc.id}</strong>
                      </p>
                      <p>
                        <strong>Статус:</strong>{' '}
                        <span
                          className={`badge ${
                            doc.status === 'ACCEPTED'
                              ? 'bg-success'
                              : doc.status === 'REJECTED'
                              ? 'bg-danger'
                              : 'bg-warning'
                          }`}
                        >
                          {doc.status_display}
                        </span>
                      </p>
                      {doc.comment && (
                        <p>
                          <strong>Комментарий:</strong> {doc.comment}
                        </p>
                      )}
                      <div className="d-flex gap-2 mb-2">
                        <Button
                          variant="contained"
                          startIcon={<Download />}
                          onClick={() => handleDownload(doc.file_path)}
                        >
                          Скачать
                        </Button>
                      </div>
                      <TextField
                        label="Комментарий"
                        value={comments[doc.id] || ''}
                        onChange={(e) => handleCommentChange(doc.id, e.target.value)}
                        fullWidth
                        multiline
                        rows={2}
                        className="mb-2"
                      />
                      <div className="d-flex gap-2">
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<Check />}
                          onClick={() => handleStatusUpdate(doc.id, 'ACCEPTED')}
                        >
                          Принять
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          startIcon={<Close />}
                          onClick={() => handleStatusUpdate(doc.id, 'REJECTED')}
                        >
                          Отклонить
                        </Button>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            )}
            {documents[interview.id]?.length === 10 &&
              documents[interview.id].every((doc) => doc.status === 'ACCEPTED') && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleConfirmHire(interview.id)}
                  className="mt-3"
                >
                  Подтвердить найм
                </Button>
              )}
          </Card>
        ))
      )}
    </div>
  );
};

export default ModeratorDocumentsPage;