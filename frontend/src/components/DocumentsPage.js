import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from './AuthContext';
import { Button, Card } from '@mui/material';
import { CloudUpload, Download, Refresh } from '@mui/icons-material';

const DocumentsPage = () => {
  const { user } = useContext(AuthContext);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setError('Пожалуйста, войдите, чтобы просмотреть документы');
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
  }, [user]);

  const handleUpload = async (documentId, file) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file_path', file);
    try {
      await axios.post(
        `http://localhost:8000/api/documents/${documentId}/upload/`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Документ успешно загружен!');
      const response = await axios.get('http://localhost:8000/api/documents/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocuments(response.data);
    } catch (err) {
      toast.error(err.response?.data?.file_path || 'Ошибка при загрузке документа');
    }
  };

  const handleDownload = (fileUrl) => {
    window.open(fileUrl, '_blank');
  };

  if (loading) return <div className="container mt-5">Загрузка...</div>;
  if (error) return <div className="container mt-5 alert alert-danger">{error}</div>;

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Документы</h1>
      <div className="row">
        {documents.length === 0 ? (
          <p>Документы отсутствуют.</p>
        ) : (
          documents.map((doc) => (
            <div className="col-md-4 mb-4" key={doc.id}>
              <Card className="p-3">
                <h5>Документ #{doc.id}</h5>
                <p>
                  <strong>Собеседование:</strong>{' '}
                  {doc.interview
                    ? `Собеседование #${doc.interview.id} (${new Date(
                        doc.interview.scheduled_at
                      ).toLocaleDateString()})`
                    : 'Не указано'}
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
                        onChange={(e) => handleUpload(doc.id, e.target.files[0])}
                      />
                    </Button>
                  )}
                  {!doc.file_path && (
                    <Button variant="contained" startIcon={<CloudUpload />} component="label">
                      Загрузить
                      <input
                        type="file"
                        hidden
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleUpload(doc.id, e.target.files[0])}
                      />
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DocumentsPage;