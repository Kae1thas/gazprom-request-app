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
  'Трудовая книжка (опционально)',
];

const practiceDocumentTypes = [
  'Паспорт',
  'Справка с учебы',
  'Учебный договор с организацией',
  'Заявка-шаблон с сайта',
];

const DocumentsPage = () => {
  const { user, loading, interviewLoading, hasSuccessfulInterview } = useContext(AuthContext);
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [activeTab, setActiveTab] = useState('JOB');

  const effectiveJobDocumentTypes = user?.gender === 'MALE' ? ['Приписное/Военник', ...jobDocumentTypes] : jobDocumentTypes;

  useEffect(() => {
    if (loading || interviewLoading) return;

    if (!user) {
      setError('Пожалуйста, войдите, чтобы просмотреть документы');
      return;
    }

    if (!hasSuccessfulInterview.JOB && !hasSuccessfulInterview.PRACTICE) {
      setError('У вас нет успешного собеседования для загрузки документов');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Токен авторизации отсутствует');
      return;
    }

    axios
      .get('http://localhost:8000/api/documents/', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setDocuments(response.data);
      })
      .catch(() => {
        setError('Не удалось загрузить документы');
      });
  }, [user, loading, interviewLoading, hasSuccessfulInterview]);

  const handleUpload = async (slot, file, resumeType) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file_path', file);
    const documentType = resumeType === 'JOB' ? effectiveJobDocumentTypes[slot - 1] : practiceDocumentTypes[slot - 1];
    formData.append('document_type', documentType);
    formData.append('resume_type', resumeType);

    try {
      const response = await axios.post(
        'http://localhost:8000/api/documents/',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Документ "${documentType}" успешно загружен!`);
      setDocuments((prev) => [...prev, response.data]);
    } catch (err) {
      toast.error(err.response?.data?.file_path || 'Ошибка при загрузке документа');
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

  const renderDocumentTable = (documentTypes, resumeType) => {
    if (!hasSuccessfulInterview[resumeType]) {
      return (
        <div className="alert alert-warning">
          У вас нет успешного собеседования для {resumeType === 'JOB' ? 'трудоустройства' : 'практики'}.
        </div>
      );
    }

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
              const doc = documents.find((d) => d.document_type === type && d.resume_type === resumeType);
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
                        {doc.status_display}
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
                          <Typography variant="body2" sx={{ mb: 2 }}>
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
                          </Typography>
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
                            accept=".pdf,.doc,.docx"
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

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Документы</h1>
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