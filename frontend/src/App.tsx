import type { ReactElement } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import LoginErrorPage from './pages/LoginErrorPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import GamePage from './pages/GamePage';
import { getUser } from './lib/auth';

// Keeps logged-out visitors off the main pages.
// If they arrived from a room QR code, remember the code until they log in.
function RequireAuth({ children }: { children: ReactElement }) {
  const location = useLocation();
  if (getUser()) return children;
  const join = new URLSearchParams(location.search).get('join')
    ?? location.pathname.match(/^\/game\/([A-Za-z0-9]+)/)?.[1];
  if (join) {
    try { sessionStorage.setItem('pending_join', join); } catch { /* ignore */ }
  }
  return <Navigate to="/" replace />;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* First page on initial access is Login */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login-error" element={<LoginErrorPage />} />
        <Route path="/verify" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/home" element={<RequireAuth><HomePage /></RequireAuth>} />
        <Route path="/game/:code" element={<RequireAuth><GamePage /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
