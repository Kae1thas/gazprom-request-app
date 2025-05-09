import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from './AuthContext';
import { Button, Card } from '@mui/material';
import { CloudUpload, Download, Refresh } from '@mui/icons-material';

const DocumentsPage = () => {
  const { user, hasSuccessfulInterview } = useContext(AuthContext);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setError('Пожалуйста, войдите, чтобы просмотреть документы');
      setLoading(false);
      return;
    }
    if (!hasSuccessfulInterview) {
      setError('У вас нет успешного собеседования для загрузки документов');
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    axios
      .get('http://localhost:8000/api/documents/', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setDocuments(response.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Не удалось загрузить документы');
        setLoading(false);
      });
  }, [user, hasSuccessfulInterview]);

  const handleUpload = async (slot, file) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file_path', file);
    try {
      const response = await axios.post(
        'http://localhost:8000/api/documents/',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Документ в слоте ${slot} успешно загружен!`);
      setDocuments((prev) => [...prev, response.data]);
    } catch (err) {
      toast.error(err.response?.data?.file_path || 'Ошибка при загрузке документа');
    }
  };

  const handleDownload = (fileUrl) => {
    window.open(fileUrl, '_blank');
  };

  if (loading) return <div className="container mt-5">Загрузка...</div>;
  if (error) return <div className="container mt-5 alert alert-danger">{error}</div>;

  const documentSlots = Array.from({ length: 10 }, (_, index) => {
    const slotNumber = index + 1;
    const doc = documents.find((d, i) => i === index);
    return (
      <div className="col-md-4 mb-4" key={slotNumber}>
        <Card className="p-3">
          <h5>Слот #{slotNumber}</h5>
          {doc ? (
            <>
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
              <div className="d-flex gap-2">
                {doc.status === 'ACCEPTED' && doc.file_path && (
                  <Button
                    variant="contained"
                    startIcon={<Download />}
                    onClick={() => handleDownload(doc.file_path)}
                  >
                    Скачать
                  </Button>
                )}
                {doc.status === 'REJECTED' && (
                  <Button variant="contained" startIcon={<Refresh />} component="label">
                    Перезагрузить
                    <input
                      type="file"
                      hidden
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleUpload(slotNumber, e.target.files[0])}
                    />
                  </Button>
                )}
              </div>
            </>
          ) : (
            <Button variant="contained" startIcon={<CloudUpload />} component="label">
              Загрузить
              <input
                type="file"
                hidden
                accept=".pdf,.doc,.docx"
                onChange={(e) => handleUpload(slotNumber, e.target.files[0])}
              />
            </Button>
          )}
        </Card>
      </div>
    );
  });

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Документы</h1>
      <p>Загрузите до 10 документов для завершения процесса найма.</p>
      <div className="row">{documentSlots}</div>
    </div>
  );
};

export default DocumentsPage;