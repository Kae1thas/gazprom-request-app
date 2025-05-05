import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from './AuthContext';

const Home = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="container mt-5">
      <div className="card text-center">
        <h1 className="card-header">Welcome to Gazprom Careers</h1>
        <div className="card-body">
          <p className="lead">Join our team and build your career with one of the leading energy companies in the world.</p>
          <p>Explore opportunities, submit your resume, and start your journey with Gazprom today!</p>
          <Link to={user ? "/dashboard" : "/register"} className="btn btn-primary">Get Started</Link>
        </div>
      </div>
    </div>
  );
};

export default Home;