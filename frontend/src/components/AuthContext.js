import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasSuccessfulInterview, setHasSuccessfulInterview] = useState(false);
  const [interviewLoading, setInterviewLoading] = useState(true); // Новое состояние для загрузки собеседований

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios
        .get('http://localhost:8000/api/me/', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          const userData = response.data.user;
          setUser({
            email: userData.email,
            fullName: `${userData.last_name} ${userData.first_name} ${userData.patronymic}`.trim() || userData.email,
            isStaff: response.data.is_staff,
            isSuperuser: response.data.is_superuser,
            candidate: response.data.candidate,
            employee: response.data.employee,
          });
          // Проверяем успешное собеседование только для кандидатов
          if (response.data.candidate) {
            axios
              .get('http://localhost:8000/api/interviews/my/', {
                headers: { Authorization: `Bearer ${token}` },
              })
              .then((interviewResponse) => {
                setHasSuccessfulInterview(interviewResponse.data.some((i) => i.result === 'SUCCESS'));
              })
              .catch(() => {
                setHasSuccessfulInterview(false);
              })
              .finally(() => {
                setInterviewLoading(false); // Завершаем загрузку собеседований
              });
          } else {
            setHasSuccessfulInterview(false);
            setInterviewLoading(false); // Если не кандидат, сразу завершаем
          }
        })
        .catch((err) => {
          console.error('Ошибка при загрузке профиля:', err.response?.data);
          localStorage.removeItem('token');
          setUser(null);
          setHasSuccessfulInterview(false);
          setInterviewLoading(false); // Завершаем загрузку в случае ошибки
        })
        .finally(() => {
          setLoading(false); // Завершаем загрузку профиля
        });
    } else {
      setLoading(false);
      setInterviewLoading(false); // Нет токена — завершаем обе загрузки
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:8000/api/token/', { email, password });
      localStorage.setItem('token', response.data.access);
      const userResponse = await axios.get('http://localhost:8000/api/me/', {
        headers: { Authorization: `Bearer ${response.data.access}` },
      });
      const userData = userResponse.data.user;
      setUser({
        email: userData.email,
        fullName: `${userData.last_name} ${userData.first_name} ${userData.patronymic}`.trim() || userData.email,
        isStaff: userResponse.data.is_staff,
        isSuperuser: userResponse.data.is_superuser,
        candidate: userResponse.data.candidate,
        employee: userResponse.data.employee,
      });
      if (userResponse.data.candidate) {
        setInterviewLoading(true); // Начинаем загрузку собеседований
        const interviewResponse = await axios.get('http://localhost:8000/api/interviews/my/', {
          headers: { Authorization: `Bearer ${response.data.access}` },
        });
        setHasSuccessfulInterview(interviewResponse.data.some((i) => i.result === 'SUCCESS'));
        setInterviewLoading(false); // Завершаем загрузку собеседований
      } else {
        setHasSuccessfulInterview(false);
        setInterviewLoading(false);
      }
      return true;
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setHasSuccessfulInterview(false);
    setInterviewLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, hasSuccessfulInterview, interviewLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};