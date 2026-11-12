import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Field from '../components/Field';
import { register, resendVerification } from '../lib/api';
import { PASSWORD_RULES, passwordOk } from '../lib/password';

const EMPTY = { firstName: '', lastName: '', email: '', password: '', confirm: '' };

function RegisterPage() {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [done, setDone] = useState<null | { message: string; emailSent: boolean }>(null);
  const [resent, setResent] = useState('');
  const [busy, setBusy] = useState(false);

  function update(key: keyof typeof EMPTY) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value });
  }

  async function doRegister(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!passwordOk(form.password)) {
      setError('Your password needs everything on the checklist above.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const res = await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      setDone({ message: res.message, emailSent: res.emailSent });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function doResend() {
    setResent('');
    try {
      const res = await resendVerification(form.email.trim());
      setResent(res.message);
    } catch (err) {
      setResent(err instanceof Error ? err.message : 'Could not send the email.');
    }
  }

  if (done) {
    return (
      <AuthLayout title="Check your email">
        <div className={`alert ${done.emailSent ? 'alert-success' : 'alert-error'}`} role="status">
          {done.emailSent ? (
            <>Welcome, {form.firstName}! We sent a link to <strong>{form.email.trim()}</strong>. Click it to verify your account, then log in.</>
          ) : done.message}
        </div>
        <button type="button" className="btn btn-secondary" onClick={doResend}>Send the link again</button>
        {resent && <p className="note" role="status">{resent}</p>}
        <p className="switch">Verified already? <Link to="/">Log in</Link></p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create an account">
      <form onSubmit={doRegister}>
        <div className="row">
          <Field id="firstName" label="First name" autoComplete="given-name" required
            value={form.firstName} onChange={update('firstName')} />
          <Field id="lastName" label="Last name" autoComplete="family-name" required
            value={form.lastName} onChange={update('lastName')} />
        </div>
        <Field id="email" label="Email" type="email" autoComplete="email" required
          value={form.email} onChange={update('email')} />
        <Field id="password" label="Password" type="password" autoComplete="new-password" required
          aria-describedby="pw-rules" value={form.password} onChange={update('password')} />
        <ul id="pw-rules" className="pw-rules" aria-label="Password requirements">
          {PASSWORD_RULES.map((r) => {
            const met = r.test(form.password);
            return (
              <li key={r.id} className={met ? 'met' : ''}>
                <span className="pw-mark" aria-hidden="true">{met ? '✓' : ''}</span>
                {r.label}<span className="sr-only">{met ? ' (done)' : ' (not yet)'}</span>
              </li>
            );
          })}
        </ul>
        <Field id="confirm" label="Confirm password" type="password" autoComplete="new-password" required
          value={form.confirm} onChange={update('confirm')} />
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="switch">
        Already have an account? <Link to="/">Log in</Link>
      </p>
    </AuthLayout>
  );
}

export default RegisterPage;
