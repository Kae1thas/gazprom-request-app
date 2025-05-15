import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [interviewLoading, setInterviewLoading] = useState(true);
  const [hasSuccessfulInterview, setHasSuccessfulInterview] = useState(false);

  const fetchUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setHasSuccessfulInterview(false);
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
        fullName: `${userData.last_name} ${userData.first_name} ${userData.patronymic}`.trim() || userData.email,
        isStaff: response.data.is_staff,
        isSuperuser: response.data.is_superuser,
        candidate: response.data.candidate,
        employee: response.data.employee,
        gender: userData.gender, // Добавляем поле gender
      };
      setUser(newUser);

      if (response.data.candidate) {
        setInterviewLoading(true);
        const hasSuccessFromApi = response.data.candidate.has_successful_interview;
        setHasSuccessfulInterview(hasSuccessFromApi);

        try {
          const interviewResponse = await axios.get('http://localhost:8000/api/interviews/my/', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const hasSuccessFromInterviews = interviewResponse.data.some((i) => i.result === 'SUCCESS');
          if (hasSuccessFromInterviews !== hasSuccessFromApi) {
            setHasSuccessfulInterview(hasSuccessFromInterviews);
            console.warn(
              `Mismatch in hasSuccessfulInterview: API says ${hasSuccessFromApi}, interviews say ${hasSuccessFromInterviews}`
            );
          }
        } catch (interviewErr) {
          console.error('Ошибка при загрузке собеседований:', interviewErr.response?.data);
        } finally {
          setInterviewLoading(false);
        }
      } else {
        setHasSuccessfulInterview(false);
        setInterviewLoading(false);
      }
    } catch (err) {
      console.error('Ошибка при загрузке профиля:', err.response?.data);
      localStorage.removeItem('token');
      setUser(null);
      setHasSuccessfulInterview(false);
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
        fullName: `${userData.last_name} ${userData.first_name} ${userData.patronymic}`.trim() || userData.email,
        isStaff: userResponse.data.is_staff,
        isSuperuser: userResponse.data.is_superuser,
        candidate: userResponse.data.candidate,
        employee: userResponse.data.employee,
        gender: userData.gender, // Добавляем поле gender
      });

      if (userResponse.data.candidate) {
        setInterviewLoading(true);
        try {
          const interviewResponse = await axios.get('http://localhost:8000/api/interviews/my/', {
            headers: { Authorization: `Bearer ${response.data.access}` },
          });
          setHasSuccessfulInterview(interviewResponse.data.some((i) => i.result === 'SUCCESS'));
        } catch (interviewErr) {
          console.error('Ошибка при загрузке собеседований:', interviewErr.response?.data);
          setHasSuccessfulInterview(userResponse.data.candidate?.has_successful_interview || false);
        } finally {
          setInterviewLoading(false);
        }
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