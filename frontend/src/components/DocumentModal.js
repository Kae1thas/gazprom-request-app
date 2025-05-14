import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Modal, Box, Typography, TextField, Button } from '@mui/material';
import { Download, Check, Close } from '@mui/icons-material';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const DocumentModal = ({ open, onClose, document, onStatusUpdate, isModerator }) => {
  const [comment, setComment] = useState(document.comment || '');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!open) return;

    setComment(document.comment || '');

    if (isModerator) {
      const fetchHistory = async () => {
        const token = localStorage.getItem('token');
        try {
          const response = await axios.get(`http://localhost:8000/api/documents/${document.id}/history/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setHistory(response.data);
        } catch (err) {
          toast.error('Ошибка при загрузке истории документа');
        }
      };
      fetchHistory();
    } else {
      setHistory([]);
    }
  }, [open, document.id, document.comment, isModerator]);

  const handleDownload = () => {
    const fullUrl = document.file_path.startsWith('http') ? document.file_path : `http://localhost:8000${document.file_path}`;
    window.open(fullUrl, '_blank');
  };

  const handleStatusUpdate = async (status) => {
    if (status === 'REJECTED' && !comment.trim()) {
      toast.error('Комментарий обязателен для отказа');
      return;
    }
    if (status === 'REJECTED' && document.status === 'REJECTED') {
      toast.error('Документ уже отклонен');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await axios.patch(
        `http://localhost:8000/api/documents/${document.id}/status/`,
        { status, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Документ #${document.id} обновлен: ${status}`);
      onStatusUpdate(response.data);
      if (isModerator) {
        const historyResponse = await axios.get(`http://localhost:8000/api/documents/${document.id}/history/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHistory(historyResponse.data);
      }
      onClose();
    } catch (err) {
      toast.error('Ошибка при обновлении статуса документа');
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" gutterBottom>
          Документ: {document.document_type}
        </Typography>
        <Box mb={2} display="flex" gap={1}>
          <Button
            onClick={handleDownload}
            sx={{
              backgroundColor: '#1976d2',
              color: '#fff',
              '&:hover': { backgroundColor: '#1565c0' },
              borderRadius: '8px',
              padding: '8px',
            }}
          >
            <Download sx={{ mr: 1 }} />
            Скачать
          </Button>
          {isModerator && (
            <>
              <Button
                onClick={() => handleStatusUpdate('ACCEPTED')}
                sx={{
                  backgroundColor: '#2e7d32',
                  color: '#fff',
                  '&:hover': { backgroundColor: '#1b5e20' },
                  borderRadius: '8px',
                  padding: '8px',
                }}
              >
                <Check sx={{ mr: 1 }} />
                Принять
              </Button>
              <Button
                onClick={() => handleStatusUpdate('REJECTED')}
                disabled={!comment.trim() || document.status === 'REJECTED'}
                sx={{
                  backgroundColor: '#d32f2f',
                  color: '#fff',
                  '&:hover': { backgroundColor: '#b71c1c' },
                  borderRadius: '8px',
                  padding: '8px',
                  opacity: !comment.trim() || document.status === 'REJECTED' ? 0.5 : 1,
                }}
              >
                <Close sx={{ mr: 1 }} />
                Отклонить
              </Button>
            </>
          )}
        </Box>
        {isModerator ? (
          <TextField
            label="Комментарий модератора"
            multiline
            rows={4}
            fullWidth
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            sx={{ mb: 2 }}
          />
        ) : (
          document.comment && (
            <Box mb={2}>
              <Typography variant="subtitle1" gutterBottom>
                Комментарий модератора:
              </Typography>
              <Typography variant="body2" sx={{ p: 1, border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                {document.comment}
              </Typography>
            </Box>
          )
        )}
        {isModerator && (
          <>
            <Typography variant="subtitle1" gutterBottom>
              История изменений:
            </Typography>
            {history.length === 0 ? (
              <Typography>История отсутствует</Typography>
            ) : (
              <Box sx={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e0e0e0', p: 1 }}>
                {history.map((entry, idx) => (
                  <Typography key={idx} variant="body2">
                    <strong>{new Date(entry.created_at).toLocaleString()}:</strong> {entry.status_display}{' '}
                    {entry.comment && `(Комментарий: ${entry.comment})`}
                  </Typography>
                ))}
              </Box>
            )}
          </>
        )}
        <Box mt={2} display="flex" justifyContent="flex-end">
          <Button onClick={onClose} variant="contained">
            Закрыть
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default DocumentModal;