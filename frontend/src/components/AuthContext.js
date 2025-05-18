import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [interviewLoading, setInterviewLoading] = useState(true);
  const [hasSuccessfulInterview, setHasSuccessfulInterview] = useState({
    JOB: false,
    PRACTICE: false,
  });

  const fetchUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setHasSuccessfulInterview({ JOB: false, PRACTICE: false });
      setLoading(false);
      setInterviewLoading(false);
      return;
    }

    try {
      const response = await axios.get('http://localhost:8000/api/me/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = response.data.user;
      const newUser = {
        email: userData.email,
        firstName: userData.first_name || '',
        lastName: userData.last_name || '',
        patronymic: userData.patronymic || '',
        isStaff: response.data.is_staff,
        isSuperuser: response.data.is_superuser,
        candidate: response.data.candidate,
        employee: response.data.employee,
        gender: userData.gender,
      };
      setUser(newUser);

      if (response.data.candidate) {
        setInterviewLoading(true);
        try {
          const interviewResponse = await axios.get('http://localhost:8000/api/interviews/my/', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const hasSuccess = {
            JOB: interviewResponse.data.some((i) => i.result === 'SUCCESS' && i.resume_type === 'JOB'),
            PRACTICE: interviewResponse.data.some((i) => i.result === 'SUCCESS' && i.resume_type === 'PRACTICE'),
          };
          setHasSuccessfulInterview(hasSuccess);
        } catch (interviewErr) {
          console.error('Ошибка при загрузке собеседований:', interviewErr.response?.data);
          setHasSuccessfulInterview({ JOB: false, PRACTICE: false });
        } finally {
          setInterviewLoading(false);
        }
      } else {
        setHasSuccessfulInterview({ JOB: false, PRACTICE: false });
        setInterviewLoading(false);
      }
    } catch (err) {
      console.error('Ошибка при загрузке профиля:', err.response?.data);
      localStorage.removeItem('token');
      setUser(null);
      setHasSuccessfulInterview({ JOB: false, PRACTICE: false });
      setInterviewLoading(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
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
        firstName: userData.first_name || '',
        lastName: userData.last_name || '',
        patronymic: userData.patronymic || '',
        isStaff: userResponse.data.is_staff,
        isSuperuser: userResponse.data.is_superuser,
        candidate: userResponse.data.candidate,
        employee: userResponse.data.employee,
        gender: userData.gender,
      });

      if (userResponse.data.candidate) {
        setInterviewLoading(true);
        try {
          const interviewResponse = await axios.get('http://localhost:8000/api/interviews/my/', {
            headers: { Authorization: `Bearer ${response.data.access}` },
          });
          setHasSuccessfulInterview({
            JOB: interviewResponse.data.some((i) => i.result === 'SUCCESS' && i.resume_type === 'JOB'),
            PRACTICE: interviewResponse.data.some((i) => i.result === 'SUCCESS' && i.resume_type === 'PRACTICE'),
          });
        } catch (interviewErr) {
          console.error('Ошибка при загрузке собеседований:', interviewErr.response?.data);
          setHasSuccessfulInterview({ JOB: false, PRACTICE: false });
        } finally {
          setInterviewLoading(false);
        }
      } else {
        setHasSuccessfulInterview({ JOB: false, PRACTICE: false });
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
    setHasSuccessfulInterview({ JOB: false, PRACTICE: false });
    setLoading(false);
    setInterviewLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, interviewLoading, hasSuccessfulInterview, login, logout, fetchUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};