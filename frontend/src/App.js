import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Компоненты
import Home from './components/Home';
import Login from './components/Login';

function App() {
  const [message, setMessage] = useState('Ожидание ответа...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Получаем данные с бэкенда
    axios.get('http://localhost:8000/api/ping/')
      .then(res => {
        setMessage(res.data.message);  // Устанавливаем ответ сервера
        setLoading(false);  // Завершаем загрузку
      })
      .catch(err => {
        setError('Ошибка соединения с backend');  // Обработка ошибки
        setLoading(false);  // Завершаем загрузку
      });
  }, []); // Пустой массив зависимостей, чтобы запрос выполнялся только один раз

  return (
    <Router>
      <div className="container mt-5">
        {/* Навигация */}
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
          <div className="container-fluid">
            <Link className="navbar-brand" to="/">MyApp</Link>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav">
                <li className="nav-item">
                  <Link className="nav-link" to="/">Home</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">Login</Link>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        {/* Страница с маршрутизацией */}
        <Routes>
          <Route path="/" element={<Home message={message} loading={loading} error={error} />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
