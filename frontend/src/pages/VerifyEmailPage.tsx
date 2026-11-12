import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { verifyEmail } from '../lib/api';

// Opened from the link in the verification email: /verify?token=...
function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [state, setState] = useState<'working' | 'ok' | 'error'>(token ? 'working' : 'error');
  const [message, setMessage] = useState(token ? '' : 'This link is missing its token. Open the link from your email again.');
  const sent = useRef(false); // StrictMode runs effects twice in dev; verify once

  useEffect(() => {
    if (!token || sent.current) return;
    sent.current = true;
    verifyEmail(token)
      .then((res) => { setState('ok'); setMessage(res.message); })
      .catch((err) => { setState('error'); setMessage(err instanceof Error ? err.message : 'Verification failed.'); });
  }, [token]);

  if (state === 'working') {
    return (
      <AuthLayout title="Verifying…">
        <p className="note" role="status">Checking your link.</p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={state === 'ok' ? 'Email verified' : 'Link not valid'}>
      <div className={`alert ${state === 'ok' ? 'alert-success' : 'alert-error'}`} role={state === 'ok' ? 'status' : 'alert'}>
        {message}
      </div>
      <Link to="/" className="btn btn-primary">Go to log in</Link>
      {state === 'error' && (
        <p className="switch">On the log in page you can ask for a new link.</p>
      )}
    </AuthLayout>
  );
}

export default VerifyEmailPage;
