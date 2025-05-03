import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Fetch candidates and resumes on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const config = {
          headers: { Authorization: `Bearer ${token}` },
        };

        // Fetch candidates
        const candidatesResponse = await axios.get('http://localhost:8000/api/candidates/', config);
        setCandidates(candidatesResponse.data);

        // Fetch resumes
        const resumesResponse = await axios.get('http://localhost:8000/api/resumes/', config);
        setResumes(resumesResponse.data);

        setLoading(false);
      } catch (err) {
        setError('Failed to fetch data');
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Update resume status
  const updateResumeStatus = async (resumeId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };
      await axios.patch(`http://localhost:8000/api/resumes/${resumeId}/`, { status: newStatus }, config);
      setResumes(resumes.map(resume =>
        resume.id === resumeId ? { ...resume, status: newStatus } : resume
      ));
    } catch (err) {
      setError('Failed to update resume status');
    }
  };

  if (loading) return <div className="container mt-5">Loading...</div>;
  if (error) return <div className="container mt-5 alert alert-danger">{error}</div>;

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Dashboard</h1>
        <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
      </div>

      {/* Candidates List */}
      <h2>Candidates</h2>
      <table className="table table-striped mb-5">
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
              <td>{candidate.user.last_name} {candidate.user.first_name}</td>
              <td>{candidate.user.email}</td>
              <td>{candidate.education}</td>
              <td>{candidate.phone_number}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Resumes List */}
      <h2>Resumes</h2>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Candidate</th>
            <th>Content</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {resumes.map(resume => (
            <tr key={resume.id}>
              <td>{resume.id}</td>
              <td>{resume.candidate.user.username}</td>
              <td>{resume.content.substring(0, 50)}...</td>
              <td>{resume.status}</td>
              <td>
                <select
                  value={resume.status}
                  onChange={(e) => updateResumeStatus(resume.id, e.target.value)}
                  className="form-select"
                >
                  <option value="PENDING">Pending</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Dashboard;