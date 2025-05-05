import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import axios from 'axios';

const Register = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Обработчик отправки формы регистрации
  const onSubmit = async (data) => {
    try {
      console.log('Отправка запроса на регистрацию:', data);
      const response = await axios.post('http://localhost:8000/api/register/', data);
      console.log('Ответ регистрации:', response.data);
      toast.success('Регистрация успешна! Пожалуйста, войдите.');
      setError('');
      navigate('/login');
    } catch (err) {
      console.error('Ошибка регистрации:', err.response?.data);
      setError(err.response?.data?.email || 'Ошибка регистрации');
    }
  };

  return (
    <div className="container mt-5">
      <div className="card shadow-sm">
        <h2 className="text-center mb-4">Регистрация</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Электронная почта</label>
            <input
              type="email"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              id="email"
              placeholder="Введите email"
              {...register('email', { 
                required: 'Электронная почта обязательна',
                pattern: { value: /^\S+@\S+$/i, message: 'Неверный формат email' }
              })}
            />
            {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">Пароль</label>
            <input
              type="password"
              className={`form-control ${errors.password ? 'is-invalid' : ''}`}
              id="password"
              placeholder="Введите пароль"
              {...register('password', { 
                required: 'Пароль обязателен',
                minLength: { value: 8, message: 'Пароль должен содержать не менее 8 символов' }
              })}
            />
            {errors.password && <div className="invalid-feedback">{errors.password.message}</div>}
          </div>
          <div className="mb-3">
            <label htmlFor="first_name" className="form-label">Имя</label>
            <input
              type="text"
              className="form-control"
              id="first_name"
              placeholder="Введите имя"
              {...register('first_name')}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="last_name" className="form-label">Фамилия</label>
            <input
              type="text"
              className="form-control"
              id="last_name"
              placeholder="Введите фамилию"
              {...register('last_name')}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="patronymic" className="form-label">Отчество</label>
            <input
              type="text"
              className="form-control"
              id="patronymic"
              placeholder="Введите отчество"
              {...register('patronymic')}
            />
          </div>
          <button type="submit" className="btn btn-primary w-100" title="Зарегистрироваться">Зарегистрироваться</button>
        </form>
        <div className="text-center mt-3">
          <p>Уже есть аккаунт? <Link to="/login" className="text-primary">Войти</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;