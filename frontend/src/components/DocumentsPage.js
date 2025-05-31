import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from './AuthContext';
import { Navigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableRow, TableHead, Button, Tooltip, Tabs, Tab, Typography } from '@mui/material';
import { CloudUpload, Download, Visibility, Delete } from '@mui/icons-material';
import DocumentModal from './DocumentModal';

const jobDocumentTypes = [
  'Паспорт',
  'Аттестат/Диплом',
  'Справка с психодиспансера',
  'Справка с наркодиспансера',
  'Справка о несудимости',
  'Согласие на обработку персональных данных',
  'ИНН',
  'СНИЛС',
  'Автобиография',
];

const practiceDocumentTypes = [
  'Паспорт',
  'Договор о практике',
  'Заявление на практику',
];

const DocumentsPage = () => {
  const { user, loading, interviewLoading, hasSuccessfulInterview } = useContext(AuthContext);
  const [documents, setDocuments] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [error, setError] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [activeTab, setActiveTab] = useState('JOB');

  const effectiveJobDocumentTypes = user?.gender === 'MALE' ? ['Военный билет/Приписное', ...jobDocumentTypes] : jobDocumentTypes;

  useEffect(() => {
    if (loading || interviewLoading) return;

    if (!user) {
      setError('Пожалуйста, войдите, чтобы просмотреть документы');
      return;
    }

    if (!hasSuccessfulInterview.JOB && !hasSuccessfulInterview.PRACTICE) {
      setError('У вас нет успешного собеседования. Пройдите собеседование, чтобы загрузить документы.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Токен авторизации отсутствует');
      return;
    }

    const fetchData = async () => {
      try {
        // Запрос собеседований
        const interviewResponse = await axios.get('http://localhost:8000/api/interviews/my/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInterviews(interviewResponse.data);

        // Запрос документов
        const docResponse = await axios.get('http://localhost:8000/api/documents/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Fetched documents:', JSON.stringify(docResponse.data, null, 2));
        setDocuments(docResponse.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Не удалось загрузить данные');
      }
    };

    fetchData();
  }, [user, loading, interviewLoading, hasSuccessfulInterview]);

  const getResumeIdForType = (resumeType) => {
    const successfulInterview = interviews.find(
      (interview) => interview.result === 'SUCCESS' && interview.resume?.resume_type === resumeType
    );
    return successfulInterview?.resume?.id || null;
  };

  const handleUpload = async (slot, file, resumeType) => {
    if (!file) {
      toast.error('Выберите файл для загрузки');
      return;
    }

    const resumeId = getResumeIdForType(resumeType);
    if (!resumeId) {
      toast.error(`Нет успешного собеседования для ${resumeType === 'JOB' ? 'трудоустройства' : 'практики'}.`);
      return;
    }

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file_path', file);
    const documentType = resumeType === 'JOB' ? effectiveJobDocumentTypes[slot - 1] : practiceDocumentTypes[slot - 1];
    formData.append('document_type', documentType);
    formData.append('resume_type', resumeType);
    formData.append('resume_id', resumeId);

    try {
      const response = await axios.post(
        'http://localhost:8000/api/documents/',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Документ "${documentType}" успешно загружен!`);
      console.log('Uploaded document:', JSON.stringify(response.data, null, 2));
      setDocuments((prev) => [...prev, response.data]);
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.file_path ||
        err.response?.data?.document_type ||
        err.response?.data?.non_field_errors ||
        'Ошибка при загрузке документа';
      if (errorMessage.includes('уже загружен')) {
        toast.error(`Документ "${documentType}" уже загружен. Удалите существующий документ, чтобы загрузить новый.`);
      } else if (errorMessage.includes('нет успешного собеседования')) {
        toast.error(`Нет успешного собеседования для ${resumeType === 'JOB' ? 'трудоустройства' : 'практики'}.`);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleDownload = (fileUrl) => {
    const fullUrl = fileUrl.startsWith('http') ? fileUrl : `http://localhost:8000${fileUrl}`;
    window.open(fullUrl, '_blank');
  };

  const handleDelete = async (docId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:8000/api/documents/${docId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Документ успешно удален!');
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ошибка при удалении документа');
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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const renderDocumentTable = (documentTypes, resumeType) => {
    if (!hasSuccessfulInterview[resumeType]) {
      return (
        <div className="alert alert-warning">
          У вас нет успешного собеседования для {resumeType === 'JOB' ? 'трудоустройства' : 'практики'}.
        </div>
      );
    }

    const resumeId = getResumeIdForType(resumeType);
    if (!resumeId) {
      return (
        <div className="alert alert-warning">
          У вас нет успешного собеседования для {resumeType === 'JOB' ? 'трудоустройства' : 'практики'}.
        </div>
      );
    }

    console.log(`Rendering table for ${resumeType}, resumeId: ${resumeId}, documents:`, JSON.stringify(documents, null, 2));

    return (
      <>
        {resumeType === 'JOB' && (
          <>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <a
                href="http://localhost:8000/media/templates/personal_data_consent_template.docx"
                download
                className="text-primary"
                style={{ textDecoration: 'underline' }}
              >
                Скачать шаблон согласия на обработку персональных данных (DOCX)
              </a>
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <a
                href="http://localhost:8000/media/templates/autobiography_template.doc"
                download
                className="text-primary"
                style={{ textDecoration: 'underline' }}
              >
                Скачать шаблон для заполнения автобиографии (DOC)
              </a>
            </Typography>
          </>
        )}
        {resumeType === 'PRACTICE' && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            <a
              href="http://localhost:8000/media/templates/practice_application_template.docx"
              download
              className="text-primary"
              style={{ textDecoration: 'underline' }}
            >
              Скачать шаблон заявки на прохождение практики (DOCX)
            </a>
          </Typography>
        )}
        <Table className="table table-striped compact-table">
          <TableHead>
            <TableRow>
              <TableCell>Тип</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell align="center">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documentTypes.map((type, index) => {
              const slotNumber = index + 1;
              const doc = documents.find(
                (d) => d.document_type === type && d.interview?.resume?.id === resumeId && d.interview?.resume?.resume_type === resumeType
              );
              console.log(`Checking doc: type=${type}, resumeId=${resumeId}, resumeType=${resumeType}, found:`, doc);
              return (
                <TableRow key={`${resumeType}-${slotNumber}`}>
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
                        {doc.status_display || doc.status}
                      </span>
                    ) : (
                      'Не загружен'
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {doc ? (
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
                        {doc.file_path && (
                          <Tooltip title="Скачать">
                            <Button
                              onClick={() => handleDownload(doc.file_path)}
                              sx={{
                                backgroundColor: '#ffc107',
                                color: '#fff',
                                '&:hover': { backgroundColor: '#e0a800' },
                                borderRadius: '8px',
                                minWidth: '40px',
                                padding: '8px',
                              }}
                            >
                              <Download fontSize="small" />
                            </Button>
                          </Tooltip>
                        )}
                        <Tooltip title="Удалить">
                          <Button
                            onClick={() => handleDelete(doc.id)}
                            sx={{
                              backgroundColor: '#d32f2f',
                              color: '#fff',
                              '&:hover': { backgroundColor: '#b71c1c' },
                              borderRadius: '8px',
                              minWidth: '40px',
                              padding: '8px',
                            }}
                          >
                            <Delete fontSize="small" />
                          </Button>
                        </Tooltip>
                      </div>
                    ) : (
                      <Tooltip title="Загрузить">
                        <Button
                          component="label"
                          sx={{
                            backgroundColor: '#2e7d32',
                            color: '#fff',
                            '&:hover': { backgroundColor: '#1b5e20' },
                            borderRadius: '8px',
                            minWidth: '40px',
                            padding: '8px',
                          }}
                        >
                          <CloudUpload fontSize="small" />
                          <input
                            type="file"
                            hidden
                            accept=".pdf"
                            onChange={(e) => handleUpload(slotNumber, e.target.files[0], resumeType)}
                          />
                        </Button>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </>
    );
  };

  if (loading || interviewLoading) {
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

  if (!hasSuccessfulInterview.JOB && !hasSuccessfulInterview.PRACTICE) {
    return (
      <div className="container mt-5 alert alert-danger">
        У вас нет успешного собеседования для загрузки документов.{' '}
        <a href="/interview" className="alert-link">
          Перейти к собеседованиям
        </a>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Мои документы</h1>
      <p>Загрузите необходимые документы для завершения процесса найма или практики.</p>
      {error && <div className="alert alert-danger">{error}</div>}
      <Tabs value={activeTab} onChange={handleTabChange} aria-label="Документы по типу">
        <Tab label="Трудоустройство" value="JOB" />
        <Tab label="Практика" value="PRACTICE" />
      </Tabs>
      <div className="mt-4">
        {activeTab === 'JOB' && renderDocumentTable(effectiveJobDocumentTypes, 'JOB')}
        {activeTab === 'PRACTICE' && renderDocumentTable(practiceDocumentTypes, 'PRACTICE')}
      </div>
      {selectedDoc && (
        <DocumentModal
          open={openModal}
          onClose={handleCloseModal}
          document={selectedDoc}
          isModerator={false}
        />
      )}
    </div>
  );
};

export default DocumentsPage;