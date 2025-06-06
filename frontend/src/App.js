import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import { AuthProvider, AuthContext } from './components/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import ModeratorHomePage from './components/ModeratorHomePage';
import ResumePage from './components/ResumePage';
import ModeratorResumePage from './components/ModeratorResumePage';
import InterviewPage from './components/InterviewPage';
import ModeratorInterviewPage from './components/ModeratorInterviewPage';
import DocumentsPage from './components/DocumentsPage';
import NotificationsPage from './components/NotificationsPage';
import FinalStatusPage from './components/FinalStatusPage';
import ModeratorDocumentsPage from './components/ModeratorDocumentsPage';
import Login from './components/Login';
import Register from './components/Register';
import FooterAbout from './components/FooterAbout';
import FooterContact from './components/FooterContact';
import ModeratorReportingPage from './components/ModeratorReportingPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading, interviewLoading } = useContext(AuthContext);

  if (loading || interviewLoading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

const AppContent = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="d-flex flex-column min-vh-100">
      <Sidebar />
      <div className={`flex-grow-1 main-content ${!user ? 'no-sidebar' : ''}`}>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                {user && user.isStaff ? <ModeratorHomePage /> : <HomePage />}
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume"
            element={
              <ProtectedRoute>
                <ResumePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume/moderator"
            element={
              <ProtectedRoute>
                <ModeratorResumePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview"
            element={
              <ProtectedRoute>
                <InterviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/moderator"
            element={
              <ProtectedRoute>
                <ModeratorInterviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <ProtectedRoute>
                <DocumentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents/moderator"
            element={
              <ProtectedRoute>
                <ModeratorDocumentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/final-status"
            element={
              <ProtectedRoute>
                <FinalStatusPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reporting"
            element={
              <ProtectedRoute>
                {user && user.isStaff ? <ModeratorReportingPage /> : <Navigate to="/home" />}
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="/about" element={<FooterAbout />} />
          <Route path="/contact" element={<FooterContact />} />
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
      <Footer className={`footer ${!user ? 'no-sidebar' : ''}`} />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;