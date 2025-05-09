import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from './AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Вход выполнен успешно!');
      setError('');
      navigate('/home');
    } catch (err) {
      console.error('Ошибка входа:', err.response?.data);
      setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Ошибка авторизации. Проверьте email и пароль.'
      );
    }
  };

  return (
    <div className="container mt-5">
      <div className="card shadow-sm">
        <h2 className="text-center mb-4">Вход</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Электронная почта</label>
            <input
              type="email"
              className="form-control"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Введите email"
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">Пароль</label>
            <input
              type="password"
              className="form-control"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100" title="Войти в систему">Войти</button>
        </form>
        <div className="text-center mt-3">
          <p>Нет аккаунта? <Link to="/register" className="text-primary">Зарегистрироваться</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;