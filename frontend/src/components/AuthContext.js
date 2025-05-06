import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('http://localhost:8000/api/me/', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(response => {
          const userData = response.data.user;
          setUser({
            email: userData.email,
            fullName: `${userData.last_name} ${userData.first_name} ${userData.patronymic}`.trim() || userData.email,
            isStaff: response.data.is_staff,
            isSuperuser: response.data.is_superuser,
            candidate: response.data.candidate,
            employee: response.data.employee
          });
        })
        .catch(err => {
          console.error('Ошибка при загрузке профиля:', err.response?.data);
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:8000/api/token/', { email, password });
      localStorage.setItem('token', response.data.access);
      const userResponse = await axios.get('http://localhost:8000/api/me/', {
        headers: { Authorization: `Bearer ${response.data.access}` }
      });
      const userData = userResponse.data.user;
      setUser({
        email: userData.email,
        fullName: `${userData.last_name} ${userData.first_name} ${userData.patronymic}`.trim() || userData.email,
        isStaff: userResponse.data.is_staff,
        isSuperuser: userResponse.data.is_superuser,
        candidate: userResponse.data.candidate,
        employee: userResponse.data.employee
      });
      return true;
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};