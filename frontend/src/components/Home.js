import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from './AuthContext';

const Home = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="container mt-5">
      <div className="card text-center shadow-sm">
        <h1 className="card-header">Добро пожаловать на «Газпром Карьера»</h1>
        <div className="card-body">
          <p className="lead">Присоединяйтесь к нашей команде и стройте карьеру или проходите практику в одной из ведущих энергетических компаний мира.</p>
          <p>Исследуйте возможности, отправляйте резюме на работу или практику и начните свой путь с «Газпром» уже сегодня!</p>
          <Link to={user ? "/resume" : "/register"} className="btn btn-primary" title="Перейти к началу работы">Начать</Link>
        </div>
      </div>
    </div>
  );
};

export default Home;