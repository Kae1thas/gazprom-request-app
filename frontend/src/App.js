import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import { AuthProvider } from './components/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import HomePage from './components/HomePage';
import ResumePage from './components/ResumePage';
import InterviewPage from './components/InterviewPage';
import DocumentsPage from './components/DocumentsPage';
import NotificationsPage from './components/NotificationsPage';
import FinalStatusPage from './components/FinalStatusPage';
import ModeratorDocumentsPage from './components/ModeratorDocumentsPage';
import Login from './components/Login';
import Register from './components/Register';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="d-flex min-vh-100">
          <Sidebar />
          <div className="flex-grow-1 main-content">
            <Navbar />
            <Routes>
              <Route path="/home" element={<HomePage />} />
              <Route path="/resume" element={<ResumePage />} />
              <Route path="/interview" element={<InterviewPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/documents/moderator" element={<ModeratorDocumentsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/final-status" element={<FinalStatusPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
            />
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;