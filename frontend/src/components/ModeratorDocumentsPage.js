import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from './AuthContext';
import { Table, TableBody, TableCell, TableHead, TableRow, Button, TextField } from '@mui/material';
import { Download, Check, Close, History, Warning } from '@mui/icons-material';

const documentTypes = [
  'Паспорт',
  'Приписное/Военник',
  'Аттестат/Диплом',
  'Справка с психодиспансера',
  'Справка с наркодиспансера',
  'Справка о несудимости',
  'Согласие на обработку персональных данных',
  'ИНН',
  'СНИЛС',
  'Трудовая книжка (опционально)',
];

const ModeratorDocumentsPage = () => {
  const { user } = useContext(AuthContext);
  const [interviews, setInterviews] = useState([]);
  const [documents, setDocuments] = useState({});
  const [comments, setComments] = useState({});
  const [history, setHistory] = useState({});
  const [showHistory, setShowHistory] = useState(null);
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

  const fetchHistory = async (documentId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`http://localhost:8000/api/documents/${documentId}/history/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory((prev) => ({ ...prev, [documentId]: response.data }));
    } catch (err) {
      toast.error('Ошибка при загрузке истории документа');
    }
  };

  const handleDownload = (fileUrl) => {
    const fullUrl = fileUrl.startsWith('http') ? fileUrl : `http://localhost:8000${fileUrl}`;
    window.open(fullUrl, '_blank');
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
      // Обновляем историю
      if (showHistory === documentId) {
        fetchHistory(documentId);
      }
    } catch (err) {
      toast.error('Ошибка при обновлении статуса документа');
    }
  };

  const handleNotifyMissing = async (interviewId) => {
    const token = localStorage.getItem('token');
    const docs = documents[interviewId] || [];
    const requiredTypes = documentTypes.slice(0, 9); // Исключаем трудовую книжку
    const uploadedTypes = docs.map((doc) => doc.document_type);
    const missingTypes = requiredTypes.filter((type) => !uploadedTypes.includes(type));
    if (missingTypes.length === 0) {
      toast.info('Все обязательные документы загружены');
      return;
    }
    try {
      await axios.post(
        'http://localhost:8000/api/documents/notify_missing/',
        { interview_id: interviewId, missing_types: missingTypes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Уведомление о недостающих документах отправлено');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ошибка при отправке уведомления');
    }
  };

  const handleRejectCandidate = async (interviewId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(
        'http://localhost:8000/api/documents/reject_candidate/',
        { interview_id: interviewId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Кандидат отклонен окончательно');
      setInterviews((prev) => prev.filter((i) => i.id !== interviewId));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ошибка при отклонении кандидата');
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

  const toggleHistory = (documentId) => {
    if (showHistory === documentId) {
      setShowHistory(null);
    } else {
      setShowHistory(documentId);
      if (!history[documentId]) {
        fetchHistory(documentId);
      }
    }
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
          <div key={interview.id} className="card p-3 mb-4">
            <h5>
              Собеседование #{interview.id} - Кандидат: {interview.candidate.user.last_name}{' '}
              {interview.candidate.user.first_name}
            </h5>
            <h6 className="mt-3">Документы:</h6>
            {(documents[interview.id] || []).length === 0 ? (
              <p>Документы не загружены.</p>
            ) : (
              <Table className="table table-striped">
                <TableHead>
                  <TableRow>
                    <TableCell>Тип документа</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell>Комментарий</TableCell>
                    <TableCell>Действия</TableCell>
                    <TableCell>История</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {documentTypes.map((type) => {
                    const doc = (documents[interview.id] || []).find((d) => d.document_type === type);
                    return (
                      <TableRow key={type}>
                        <TableCell>{type}</TableCell>
                        <TableCell>
                          {doc ? (
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
                          ) : (
                            'Не загружен'
                          )}
                        </TableCell>
                        <TableCell>
                          {doc && (
                            <TextField
                              value={comments[doc.id] || doc.comment || ''}
                              onChange={(e) => handleCommentChange(doc.id, e.target.value)}
                              fullWidth
                              multiline
                              rows={2}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {doc && (
                            <div className="d-flex gap-2">
                              <Button
                                variant="contained"
                                startIcon={<Download />}
                                onClick={() => handleDownload(doc.file_path)}
                              >
                                Скачать
                              </Button>
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
                          )}
                        </TableCell>
                        <TableCell>
                          {doc && (
                            <Button
                              variant="outlined"
                              startIcon={<History />}
                              onClick={() => toggleHistory(doc.id)}
                            >
                              {showHistory === doc.id ? 'Скрыть' : 'Показать'}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
            {showHistory && history[showHistory] && (
              <div className="card mt-4">
                <h5 className="card-header">История изменений документа</h5>
                <div className="card-body">
                  {history[showHistory].length === 0 ? (
                    <p>История отсутствует</p>
                  ) : (
                    <ul>
                      {history[showHistory].map((entry, idx) => (
                        <li key={idx}>
                          <strong>{new Date(entry.created_at).toLocaleString()}:</strong> {entry.status_display}{' '}
                          {entry.comment && `(Комментарий: ${entry.comment})`}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
            <div className="d-flex gap-2 mt-3">
              <Button
                variant="contained"
                startIcon={<Warning />}
                onClick={() => handleNotifyMissing(interview.id)}
              >
                Уведомить о недостающих
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => handleRejectCandidate(interview.id)}
              >
                Отклонить кандидата
              </Button>
              {documents[interview.id]?.length >= 9 &&
                documents[interview.id].filter((doc) => documentTypes.slice(0, 9).includes(doc.document_type)).every((doc) => doc.status === 'ACCEPTED') && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleConfirmHire(interview.id)}
                  >
                    Подтвердить найм
                  </Button>
                )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ModeratorDocumentsPage;