import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to view the dashboard');
      return;
    }

    // Получаем список кандидатов
    axios.get('http://localhost:8000/api/candidates/', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => setCandidates(response.data))
      .catch(() => setError('Failed to fetch candidates'));

    // Получаем список резюме
    axios.get('http://localhost:8000/api/resumes/', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => setResumes(response.data))
      .catch(() => setError('Failed to fetch resumes'));
  }, []);

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Dashboard</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="card mb-4">
        <h2 className="card-header">Candidates</h2>
        <div className="card-body">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Education</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map(candidate => (
                <tr key={candidate.id}>
                  <td>{candidate.user.last_name} {candidate.user.first_name} {candidate.user.patronymic}</td>
                  <td>{candidate.user.email}</td>
                  <td>{candidate.education || 'N/A'}</td>
                  <td>{candidate.phone_number || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <h2 className="card-header">Resumes</h2>
        <div className="card-body">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Content</th>
                <th>Status</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {resumes.map(resume => (
                <tr key={resume.id}>
                  <td>{resume.candidate.user.last_name} {resume.candidate.user.first_name} {resume.candidate.user.patronymic}</td>
                  <td>{resume.content.substring(0, 50)}...</td>
                  <td>{resume.status}</td>
                  <td>{new Date(resume.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;