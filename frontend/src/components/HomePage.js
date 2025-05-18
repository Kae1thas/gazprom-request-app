import React, { useContext } from 'react';
import { AuthContext } from './AuthContext';
import { Card, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const { user } = useContext(AuthContext);

  // Формируем приветствие
  const getGreeting = (user) => {
    if (!user) return 'Присоединяйтесь к нам!';
    const { firstName, lastName, patronymic } = user;
    if (patronymic) {
      return `Здравствуйте, ${firstName} ${patronymic}!`;
    }
    return `Здравствуйте, ${lastName} ${firstName}!`;
  };

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Карьера в ООО «Газпром информ»</h1>
      <Card className="p-4">
        <h4>{getGreeting(user)}</h4>
        <p>
          Кадровая политика ООО «Газпром информ» направлена на привлечение и развитие персонала высокой квалификации. В числе приоритетных задач — повышение профессиональных компетенций специалистов, значимых для ИТ-отрасли.
        </p>
        <p>
          Работники — это основной стратегический ресурс, обеспечивающий конкурентоспособность и способствующий успеху любого предприятия. 
          Именно поэтому Общество ведет активную работу по совершенствованию своей организационной структуры, развитию корпоративной культуры. 
          Для работников Общества созданы оптимальные условия как для эффективной профессиональной деятельности, так и для интересной и насыщенной корпоративной жизни, укрепления командного духа.
        </p>
        <p>
          {user
            ? 'Перейдите в личный кабинет, чтобы подать заявку на работу или практику.'
            : 'Зарегистрируйтесь или войдите, чтобы подать заявку на работу или практику.'}
        </p>
        <div className="d-flex gap-3 mt-4">
          {user ? (
            <Button
              variant="contained"
              color="primary"
              component={Link}
              to={user.isStaff ? "/resumes" : "/resume"}
            >
              Перейти в личный кабинет
            </Button>
          ) : (
            <>
              <Button variant="contained" color="primary" component={Link} to="/register">
                Регистрация
              </Button>
              <Button variant="outlined" color="primary" component={Link} to="/login">
                Вход
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default HomePage;