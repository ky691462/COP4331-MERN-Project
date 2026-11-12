import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Field from '../components/Field';
import { forgotPassword } from '../lib/api';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function doSend(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await forgotPassword(email.trim());
      setSent(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Reset your password">
      {sent ? (
        <div className="alert alert-success" role="status">{sent}</div>
      ) : (
        <form onSubmit={doSend}>
          <p className="note">Enter your account's email and we'll send you a link to choose a new password.</p>
          <Field id="email" label="Email" type="email" autoComplete="email" required
            value={email} onChange={(e) => setEmail(e.target.value)} />
          {error && <div className="alert alert-error" role="alert">{error}</div>}
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
      <p className="switch">Remembered it? <Link to="/">Log in</Link></p>
    </AuthLayout>
  );
}

export default ForgotPasswordPage;
