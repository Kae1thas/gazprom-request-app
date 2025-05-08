import React, { useContext } from 'react';
import { AuthContext } from './AuthContext';
import { Card, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Добро пожаловать в Газпром Карьера</h1>
      <Card className="p-4">
        <h3>О приложении</h3>
        <p>
          «Газпром Карьера» — это платформа для управления процессом найма. Кандидаты могут подавать резюме,
          проходить собеседования, загружать документы и получать уведомления о статусе своих заявок.
          Сотрудники и администраторы могут просматривать резюме, назначать собеседования и управлять
          документами.
        </p>
        {user ? (
          <>
            <h4>Здравствуйте, {user.first_name || user.email}!</h4>
            <p>Перейдите в личный кабинет, чтобы управлять вашими резюме и собеседованиями.</p>
            <Button
              variant="contained"
              color="primary"
              component={Link}
              to={user.isStaff ? "/resumes" : "/resume"}
            >
              Перейти в личный кабинет
            </Button>
          </>
        ) : (
          <>
            <h4>Присоединяйтесь к нам!</h4>
            <p>Зарегистрируйтесь или войдите, чтобы начать подавать заявки.</p>
            <div className="d-flex gap-3">
              <Button variant="contained" color="primary" component={Link} to="/register">
                Регистрация
              </Button>
              <Button variant="outlined" color="primary" component={Link} to="/login">
                Вход
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default HomePage;