import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from './AuthContext';
import { Navigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableRow, TableHead, Button, Tooltip } from '@mui/material';
import { CloudUpload, Download, Refresh, Visibility } from '@mui/icons-material';
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

const DocumentsPage = () => {
  const { user, loading, interviewLoading, hasSuccessfulInterview } = useContext(AuthContext);
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => {
    if (loading || interviewLoading) return;

    if (!user) {
      setError('Пожалуйста, войдите, чтобы просмотреть документы');
      return;
    }

    if (!hasSuccessfulInterview) {
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

  const handleUpload = async (slot, file) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file_path', file);
    const documentType = documentTypes[slot - 1];
    formData.append('document_type', documentType);

    try {
      const doc = documents.find((d) => d.document_type === documentType);
      let response;
      if (doc && doc.status === 'REJECTED') {
        response = await axios.patch(
          `http://localhost:8000/api/documents/${doc.id}/upload/`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.post(
          'http://localhost:8000/api/documents/',
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      toast.success(`Документ "${documentType}" успешно загружен!`);
      setDocuments((prev) => {
        if (doc && doc.status === 'REJECTED') {
          return prev.map((d) => (d.id === doc.id ? response.data : d));
        }
        return [...prev, response.data];
      });
    } catch (err) {
      toast.error(err.response?.data?.file_path || 'Ошибка при загрузке документа');
    }
  };

  const handleDownload = (fileUrl) => {
    const fullUrl = fileUrl.startsWith('http') ? fileUrl : `http://localhost:8000${fileUrl}`;
    window.open(fullUrl, '_blank');
  };

  const handleOpenModal = (doc) => {
    setSelectedDoc(doc);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedDoc(null);
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

  if (!hasSuccessfulInterview) {
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
      <h1 className="mb-4">Документы</h1>
      <p>Загрузите до 10 документов для завершения процесса найма.</p>
      {error && <div className="alert alert-danger">{error}</div>}
      <Table className="table table-striped compact-table">
        <TableHead>
          <TableRow>
            <TableCell>Тип</TableCell>
            <TableCell>Статус</TableCell>
            <TableCell>Комментарий</TableCell>
            <TableCell align="center">Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {documentTypes.map((type, index) => {
            const slotNumber = index + 1;
            const doc = documents.find((d) => d.document_type === type);
            return (
              <TableRow key={slotNumber}>
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
                <TableCell>{doc?.comment || ''}</TableCell>
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
                      )}
                      {doc.status === 'REJECTED' && (
                        <Tooltip title="Перезагрузить">
                          <Button
                            component="label"
                            sx={{
                              backgroundColor: '#ed6c02',
                              color: '#fff',
                              '&:hover': { backgroundColor: '#d45d00' },
                              borderRadius: '8px',
                              minWidth: '40px',
                              padding: '8px',
                            }}
                          >
                            <Refresh fontSize="small" />
                            <input
                              type="file"
                              hidden
                              accept=".pdf,.doc,.docx"
                              onChange={(e) => handleUpload(slotNumber, e.target.files[0])}
                            />
                          </Button>
                        </Tooltip>
                      )}
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
                          onChange={(e) => handleUpload(slotNumber, e.target.files[0])}
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