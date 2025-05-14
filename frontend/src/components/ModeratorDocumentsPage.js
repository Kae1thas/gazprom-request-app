import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from './AuthContext';
import { Table, TableBody, TableCell, TableHead, TableRow, Button, Tooltip } from '@mui/material';
import { Warning, PersonAdd, PersonRemove, Download, Visibility } from '@mui/icons-material';
import DocumentModal from './DocumentModal';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

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

  const handleNotifyMissing = async (interviewId) => {
    const token = localStorage.getItem('token');
    const docs = documents[interviewId] || [];
    const requiredTypes = documentTypes.slice(0, 9);
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

  const handleOpenModal = (doc) => {
    setSelectedDoc(doc);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedDoc(null);
  };

  const handleStatusUpdate = (updatedDoc) => {
    setDocuments((prev) => {
      const updatedDocs = { ...prev };
      Object.keys(updatedDocs).forEach((interviewId) => {
        updatedDocs[interviewId] = updatedDocs[interviewId].map((doc) =>
          doc.id === updatedDoc.id ? updatedDoc : doc
        );
      });
      return updatedDocs;
    });
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
              <Table className="table table-striped compact-table">
                <TableHead>
                  <TableRow>
                    <TableCell>Тип</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell align="center">Действия</TableCell>
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
                        <TableCell align="center">
                          {doc && (
                            <div className="d-flex gap-1 justify-content-center">
                              <Tooltip title="Просмотреть">
                                <Button
                                  onClick={() => handleOpenModal(doc)}
                                  sx={{
                                    backgroundColor: '#1976d2',
                                    color: '#fff',
                                    '&:hover': { backgroundColor: '#1565c0' },
                                    borderRadius: '8px',
                                    minWidth: '40px',
                                    padding: '8px',
                                  }}
                                >
                                  <Visibility fontSize="small" />
                                </Button>
                              </Tooltip>
                              <Tooltip title="Скачать">
                                <Button
                                  onClick={() => {
                                    const fullUrl = doc.file_path.startsWith('http')
                                      ? doc.file_path
                                      : `http://localhost:8000${doc.file_path}`;
                                    window.open(fullUrl, '_blank');
                                  }}
                                  sx={{
                                    backgroundColor: '#1976d2',
                                    color: '#fff',
                                    '&:hover': { backgroundColor: '#1565c0' },
                                    borderRadius: '8px',
                                    minWidth: '40px',
                                    padding: '8px',
                                  }}
                                >
                                  <Download fontSize="small" />
                                </Button>
                              </Tooltip>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
            <div className="d-flex gap-2 mt-3">
              <Tooltip title="Уведомить о недостающих документах">
                <Button
                  onClick={() => handleNotifyMissing(interview.id)}
                  sx={{
                    backgroundColor: '#ed6c02',
                    color: '#fff',
                    '&:hover': { backgroundColor: '#d45d00' },
                    borderRadius: '8px',
                    minWidth: '40px',
                    padding: '8px',
                  }}
                >
                  <Warning />
                </Button>
              </Tooltip>
              <Tooltip title="Отклонить кандидата">
                <Button
                  onClick={() => handleRejectCandidate(interview.id)}
                  sx={{
                    backgroundColor: '#d32f2f',
                    color: '#fff',
                    '&:hover': { backgroundColor: '#b71c1c' },
                    borderRadius: '8px',
                    minWidth: '40px',
                    padding: '8px',
                  }}
                >
                  <PersonRemove />
                </Button>
              </Tooltip>
              {documents[interview.id]?.length >= 9 &&
                documents[interview.id].filter((doc) => documentTypes.slice(0, 9).includes(doc.document_type)).every((doc) => doc.status === 'ACCEPTED') && (
                  <Tooltip title="Подтвердить найм">
                    <Button
                      onClick={() => handleConfirmHire(interview.id)}
                      sx={{
                        backgroundColor: '#2e7d32',
                        color: '#fff',
                        '&:hover': { backgroundColor: '#1b5e20' },
                        borderRadius: '8px',
                        minWidth: '40px',
                        padding: '8px',
                      }}
                    >
                      <PersonAdd />
                    </Button>
                  </Tooltip>
                )}
            </div>
          </div>
        ))
      )}
      {selectedDoc && (
        <DocumentModal
          open={openModal}
          onClose={handleCloseModal}
          document={selectedDoc}
          onStatusUpdate={handleStatusUpdate}
          isModerator={true}
        />
      )}
    </div>
  );
};

export default ModeratorDocumentsPage;