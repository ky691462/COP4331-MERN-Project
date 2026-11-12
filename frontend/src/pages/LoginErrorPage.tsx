import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

// Deliberately generic: never say whether the email or the password was wrong.
function LoginErrorPage() {
  return (
    <AuthLayout title="Login failed">
      <div className="alert alert-error" role="alert">
        That email and password don't match an account. Check them and try again.
      </div>
      <Link to="/" className="btn btn-primary">Try again</Link>
      <p className="switch">
        No account yet? <Link to="/register">Create one</Link>
      </p>
      <p className="switch switch-tight">
        <Link to="/forgot-password">Forgot your password?</Link>
      </p>
    </AuthLayout>
  );
}

export default LoginErrorPage;
