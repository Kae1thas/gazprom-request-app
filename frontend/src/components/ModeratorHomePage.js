import React, { useContext } from 'react';
import { AuthContext } from './AuthContext';
import { Card, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const ModeratorHomePage = () => {
  const { user } = useContext(AuthContext);

  // Формируем приветствие для сотрудника
  const getGreeting = (user) => {
    const { firstName, lastName, patronymic } = user;
    if (patronymic) {
      return `Здравствуйте, ${firstName} ${patronymic}!`;
    }
    return `Здравствуйте, ${lastName} ${firstName}!`;
  };

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Панель управления персоналом Организации</h1>
      <Card className="p-4">
        <h4>{getGreeting(user)}</h4>
        <p>
          Добро пожаловать в панель управления для сотрудников. Здесь вы можете управлять процессом обработки заявок на работу и практику, просматривать резюме, назначать собеседования и проверять документы кандидатов.
        </p>
        <h5>Рабочая информация</h5>
        <p>
          В вашей зоне ответственности:
          <ul>
            <li>Обработка резюме кандидатов: просмотр, принятие или отклонение заявок.</li>
            <li>Назначение и проведение собеседований с кандидатами.</li>
            <li>Проверка документов, загруженных кандидатами после успешных собеседований.</li>
            <li>Подтверждение найма или отклонение кандидатов на финальном этапе.</li>
          </ul>
        </p>
        <p>
          Для начала работы выберите одну из доступных функций ниже:
        </p>
        <div className="d-flex flex-column gap-3 mt-4">
          <Button
            variant="contained"
            color="primary"
            component={Link}
            to="/resume/moderator"
          >
            Просмотреть резюме кандидатов
          </Button>
          <Button
            variant="contained"
            color="primary"
            component={Link}
            to="/interview/moderator"
          >
            Управление собеседованиями
          </Button>
          <Button
            variant="contained"
            color="primary"
            component={Link}
            to="/documents/moderator"
          >
            Проверка документов
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ModeratorHomePage;