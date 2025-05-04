import React from 'react';

const Home = () => {
  return (
    <div className="container mt-5">
      <div className="card text-center">
        <h1 className="card-header">Welcome to Gazprom Careers</h1>
        <div className="card-body">
          <p className="lead">Join our team and build your career with one of the leading energy companies in the world.</p>
          <p>Explore opportunities, submit your resume, and start your journey with Gazprom today!</p>
          <a href="/register" className="btn btn-primary">Get Started</a>
        </div>
      </div>
    </div>
  );
};

export default Home;