import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Field from '../components/Field';
import { ApiError, login, resendVerification } from '../lib/api';
import { saveUser } from '../lib/auth';
import { IDLE_MINUTES } from '../lib/useIdleLogout';

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [unverified, setUnverified] = useState(false);
  const [resent, setResent] = useState('');
  const [busy, setBusy] = useState(false);
  const [params] = useSearchParams();
  const timedOut = params.get('timeout') === '1' && !error && !unverified;
  const expired = params.get('expired') === '1' && !error && !unverified;

  async function doLogin(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setUnverified(false);
    setResent('');
    try {
      const res = await login(email.trim(), password);
      saveUser({ ...res.user, token: res.token });
      // If they scanned a room QR before logging in, take them back to it.
      let join = '';
      try { join = sessionStorage.getItem('pending_join') ?? ''; sessionStorage.removeItem('pending_join'); } catch { /* ignore */ }
      navigate(join ? `/home?join=${encodeURIComponent(join)}` : '/home');
    } catch (err) {
      if (err instanceof ApiError && err.status === 403 && err.data.needsVerification) {
        setUnverified(true);
      } else if (err instanceof ApiError && err.status === 401) {
        // Lab requirement: wrong credentials -> separate generic login failure page.
        navigate('/login-error');
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function doResend() {
    setResent('');
    try {
      const res = await resendVerification(email.trim());
      setResent(res.message);
    } catch (err) {
      setResent(err instanceof Error ? err.message : 'Could not send the email.');
    }
  }

  return (
    <AuthLayout title="Log in">
      {timedOut && (
        <div className="alert alert-info" role="status">
          You were logged out after {IDLE_MINUTES} {IDLE_MINUTES === 1 ? 'minute' : 'minutes'} without activity. Log in again to keep playing.
        </div>
      )}
      {expired && (
        <div className="alert alert-info" role="status">Your session expired. Log in again to keep playing.</div>
      )}
      {unverified && (
        <div className="alert alert-info" role="status">
          <p className="alert-text">Please verify your email first. We sent a link to <strong>{email.trim()}</strong>.</p>
          <button type="button" className="btn btn-secondary btn-inline" onClick={doResend}>Send the link again</button>
          {resent && <p className="alert-text alert-note">{resent}</p>}
        </div>
      )}
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      <form onSubmit={doLogin}>
        <Field
          id="loginEmail"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          id="loginPassword"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="forgot"><Link to="/forgot-password">Forgot your password?</Link></p>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="switch">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </AuthLayout>
  );
}

export default LoginPage;
