import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from './AuthContext';
import {
  Table, TableBody, TableCell, TableHead, TableRow, Button, Tooltip, TextField, Select, MenuItem, FormControl, InputLabel,
  Collapse, IconButton, Box, Typography, Modal
} from '@mui/material';
import { Warning, PersonAdd, PersonRemove, Download, Visibility, ExpandMore, ExpandLess } from '@mui/icons-material';
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

const modalStyle = {
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

const ModeratorDocumentsPage = () => {
  const { user } = useContext(AuthContext);
  const [interviews, setInterviews] = useState([]);
  const [documents, setDocuments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [expanded, setExpanded] = useState({});
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [hireDate, setHireDate] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  const formatDate = (isoDate) => {
    if (!isoDate) return 'Не указана';
    const date = new Date(isoDate);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  useEffect(() => {
    if (!user?.isStaff) {
      setError('Доступ только для модераторов');
      setLoading(false);
      return;
    }

    setDocuments({});
    const token = localStorage.getItem('token');
    axios
      .get('http://localhost:8000/api/interviews/', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        const successfulInterviews = response.data.filter((i) => i.result === 'SUCCESS');
        setInterviews(successfulInterviews);
        setExpanded(successfulInterviews.reduce((acc, interview) => ({
          ...acc,
          [interview.id]: true
        }), {}));
        successfulInterviews.forEach((interview) => {
          axios
            .get(`http://localhost:8000/api/documents/?interview=${interview.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .then((docResponse) => {
              setDocuments((prev) => ({ ...prev, [interview.id]: docResponse.data }));
            })
            .catch((err) => {
              console.error(`Error fetching documents for interview ${interview.id}:`, err);
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
    const interview = interviews.find((i) => i.id === interviewId);
    const isMale = interview.candidate.user.gender === 'MALE';
    const requiredTypes = isMale ? documentTypes.slice(0, 9) : documentTypes.filter((type) => type !== 'Приписное/Военник').slice(0, 8);
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

  const handleOpenConfirmModal = (interview) => {
    setSelectedInterview(interview);
    const jobTypeDisplay = interview.resume_type === 'JOB' && interview.job_type_display ? interview.job_type_display : '';
    const applicationType = interview.resume_type === 'JOB' 
      ? `работу${jobTypeDisplay ? ` (${jobTypeDisplay})` : ''}` 
      : `${interview.practice_type_display || 'практику'}`;
    const defaultMessage = `Уважаемый(ая) ${interview.candidate.user.first_name} !\n\nПоздравляем! Ваш прием на ${applicationType} назначен на [дата].\n\nСтатус: Приняты на ${applicationType}\n\nПожалуйста, проверьте ваш личный кабинет для получения дополнительной информации.\n\nЕсли у вас есть вопросы, свяжитесь с нами по адресу shishaghoul@gmail.com.\n\nС уважением,\n«Газпром Карьера»`;
    setEmailMessage(defaultMessage);
    setHireDate('');
    setOpenConfirmModal(true);
  };

  const handleCloseConfirmModal = () => {
    setOpenConfirmModal(false);
    setSelectedInterview(null);
    setHireDate('');
    setEmailMessage('');
  };

  const handleConfirmHire = async (interviewId, hireDate, message) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        'http://localhost:8000/api/documents/confirm_hire/',
        { interview_id: interviewId, hire_date: hireDate, message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(response.data.message || 'Кандидат успешно принят на работу или практику!');
      setInterviews((prev) => prev.filter((i) => i.id !== interviewId));
      handleCloseConfirmModal();
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

  const toggleExpand = (interviewId) => {
    setExpanded((prev) => ({ ...prev, [interviewId]: !prev[interviewId] }));
  };

  const filteredInterviews = useMemo(() => {
    let result = [...interviews];
    
    if (searchQuery) {
      result = result.filter((interview) =>
        `${interview.candidate.user.last_name} ${interview.candidate.user.first_name}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'id') {
        return sortOrder === 'asc' ? a.id - b.id : b.id - a.id;
      } else if (sortBy === 'name') {
        const nameA = `${a.candidate.user.last_name} ${a.candidate.user.first_name}`.toLowerCase();
        const nameB = `${b.candidate.user.last_name} ${b.candidate.user.first_name}`.toLowerCase();
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      } else if (sortBy === 'date') {
        const dateA = new Date(a.scheduled_at || '1970-01-01');
        const dateB = new Date(b.scheduled_at || '1970-01-01');
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });

    return result;
  }, [interviews, searchQuery, sortBy, sortOrder]);

  if (loading) return <Box className="container mx-auto mt-5">Загрузка...</Box>;
  if (error) return <Box className="container mx-auto mt-5 alert alert-danger">{error}</Box>;

  return (
    <Box className="container mx-auto mt-5 pl-64 pt-20">
      <h1 className="mb-4">Управление документами</h1>
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        <TextField
          label="Поиск по имени кандидата"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flex: 1, minWidth: 200 }}
          size="small"
        />
        <FormControl variant="outlined" size="small" sx={{ width: 200 }}>
          <InputLabel id="sort-by-label">Сортировать по</InputLabel>
          <Select
            labelId="sort-by-label"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            label="Сортировать по"
          >
            <MenuItem value="id">ID собеседования</MenuItem>
            <MenuItem value="name">Имя кандидата</MenuItem>
            <MenuItem value="date">Дата собеседования</MenuItem>
          </Select>
        </FormControl>
        <FormControl variant="outlined" size="small" sx={{ width: 200 }}>
          <InputLabel id="sort-order-label">Порядок</InputLabel>
          <Select
            labelId="sort-order-label"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            label="Порядок"
          >
            <MenuItem value="asc">По возрастанию</MenuItem>
            <MenuItem value="desc">По убыванию</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {filteredInterviews.length === 0 ? (
        <Typography>Нет кандидатов с успешными собеседованиями.</Typography>
      ) : (
        filteredInterviews.map((interview) => (
          <Box key={interview.id} className="card p-3 mb-4 shadow-sm">
            <Box className="flex justify-between items-center">
              <Box>
                <Typography variant="h6">
                  Собеседование #{interview.id} - Кандидат: {interview.candidate.user.last_name}{' '}
                  {interview.candidate.user.first_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Тип заявки: {interview.resume_type === 'JOB' ? 'Работа' : 'Практика'}
                </Typography>
                {interview.resume_type === 'PRACTICE' && (
                  <Typography variant="body2" color="text.secondary">
                    Тип практики: {interview.practice_type_display || '-'}
                  </Typography>
                )}
                {interview.resume_type === 'JOB' && (
                  <Typography variant="body2" color="text.secondary">
                    Тип работы: {interview.job_type_display || '-'}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                  Дата: {formatDate(interview.scheduled_at)}
                </Typography>
              </Box>
              <IconButton onClick={() => toggleExpand(interview.id)}>
                {expanded[interview.id] ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
            <Collapse in={expanded[interview.id]}>
              <Typography variant="subtitle1" className="mt-3">Документы:</Typography>
              {(documents[interview.id] || []).length === 0 ? (
                <Typography>Документы не загружены.</Typography>
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
              <Box className="d-flex gap-2 mt-3">
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
                {documents[interview.id]?.length >= (interview.candidate.user.gender === 'MALE' ? 9 : 8) &&
                  documents[interview.id]
                    .filter((doc) => (interview.candidate.user.gender === 'MALE' ? documentTypes.slice(0, 9) : documentTypes.filter((type) => type !== 'Приписное/Военник').slice(0, 8)).includes(doc.document_type))
                    .every((doc) => doc.status === 'ACCEPTED') && (
                    <Tooltip title="Подтвердить найм">
                      <Button
                        onClick={() => handleOpenConfirmModal(interview)}
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
              </Box>
            </Collapse>
          </Box>
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
      {selectedInterview && (
        <Modal open={openConfirmModal} onClose={handleCloseConfirmModal}>
          <Box sx={modalStyle}>
            <Typography variant="h6" gutterBottom>
              Подтверждение найма
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Выберите дату приема и проверьте сообщение, которое будет отправлено кандидату.
            </Typography>
            <TextField
              label="Дата приема"
              type="date"
              value={hireDate}
              onChange={(e) => setHireDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Сообщение для отправки"
              multiline
              rows={8}
              value={emailMessage.replace('[дата]', hireDate ? formatDate(hireDate) : '[дата]')}
              onChange={(e) => setEmailMessage(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />
            <Box mt={2} display="flex" justifyContent="flex-end" gap={1}>
              <Button
                onClick={handleCloseConfirmModal}
                sx={{
                  backgroundColor: '#d32f2f',
                  color: '#fff',
                  '&:hover': { backgroundColor: '#b71c1c' },
                }}
              >
                Отмена
              </Button>
              <Button
                onClick={() => handleConfirmHire(selectedInterview.id, hireDate, emailMessage.replace('[дата]', hireDate ? formatDate(hireDate) : ''))}
                disabled={!hireDate}
                sx={{
                  backgroundColor: '#2e7d32',
                  color: '#fff',
                  '&:hover': { backgroundColor: '#1b5e20' },
                  opacity: !hireDate ? 0.5 : 1,
                }}
              >
                Подтвердить
              </Button>
            </Box>
          </Box>
        </Modal>
      )}
    </Box>
  );
};

export default ModeratorDocumentsPage;