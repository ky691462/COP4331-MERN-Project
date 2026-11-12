import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Field from '../components/Field';
import { resetPassword } from '../lib/api';
import { PASSWORD_RULES, passwordOk } from '../lib/password';

// Opened from the link in the reset email: /reset-password?token=...
function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(token ? '' : 'This link is missing its token. Open the link from your email again.');
  const [done, setDone] = useState('');
  const [busy, setBusy] = useState(false);

  async function doReset(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!passwordOk(password)) {
      setError('Your password needs everything on the checklist above.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const res = await resetPassword(token, password);
      setDone(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <AuthLayout title="Password updated">
        <div className="alert alert-success" role="status">{done}</div>
        <Link to="/" className="btn btn-primary">Go to log in</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password">
      <form onSubmit={doReset}>
        <Field id="password" label="New password" type="password" autoComplete="new-password" required
          aria-describedby="pw-rules" value={password} onChange={(e) => setPassword(e.target.value)} />
        <ul id="pw-rules" className="pw-rules" aria-label="Password requirements">
          {PASSWORD_RULES.map((r) => {
            const met = r.test(password);
            return (
              <li key={r.id} className={met ? 'met' : ''}>
                <span className="pw-mark" aria-hidden="true">{met ? '✓' : ''}</span>
                {r.label}<span className="sr-only">{met ? ' (done)' : ' (not yet)'}</span>
              </li>
            );
          })}
        </ul>
        <Field id="confirm" label="Confirm new password" type="password" autoComplete="new-password" required
          value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <button type="submit" className="btn btn-primary" disabled={busy || !token}>
          {busy ? 'Saving…' : 'Save new password'}
        </button>
      </form>
      <p className="switch"><Link to="/forgot-password">Need a new link?</Link></p>
    </AuthLayout>
  );
}

export default ResetPasswordPage;
