import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Создаем контекст для управления авторизацией
export const AuthContext = createContext();

// Провайдер контекста авторизации
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Проверяем наличие токена при загрузке
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('http://localhost:8000/api/me/', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(response => {
          setUser({
            email: response.data.user.email,
            fullName: `${response.data.user.last_name} ${response.data.user.first_name} ${response.data.user.patronymic}`.trim() || response.data.user.email
          });
        })
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Функция входа в систему
  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:8000/api/token/', { email, password });
      localStorage.setItem('token', response.data.access);
      const userResponse = await axios.get('http://localhost:8000/api/me/', {
        headers: { Authorization: `Bearer ${response.data.access}` }
      });
      setUser({
        email: userResponse.data.user.email,
        fullName: `${userResponse.data.user.last_name} ${userResponse.data.user.first_name} ${userResponse.data.user.patronymic}`.trim() || userResponse.data.user.email
      });
      return true;
    } catch (err) {
      throw err;
    }
  };

  // Функция выхода из системы
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