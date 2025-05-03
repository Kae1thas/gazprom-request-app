import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [message, setMessage] = useState('Ожидание ответа...');

  useEffect(() => {
    axios.get('http://localhost:8000/api/ping/')
      .then(res => setMessage(res.data.message))
      .catch(err => setMessage('Ошибка соединения с backend'));
  }, []);

  return (
    <div className="container mt-5">
      <h1 className="text-center">Проверка связи React ↔ Django</h1>
      <p className="text-center">Ответ от backend: {message}</p>
    </div>
  );
}

export default App;
