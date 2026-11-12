import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Wordmark from './Wordmark';
import ThemeToggle from './ThemeToggle';
import { clearUser, getUser } from '../lib/auth';

// Top bar for the logged-in pages. `actions` adds buttons before Log out.
function TopBar({ actions }: { actions?: ReactNode }) {
  const navigate = useNavigate();
  const user = getUser();

  function doLogout() {
    clearUser();
    navigate('/');
  }

  return (
    <header className="topbar">
      <Wordmark size="sm" />
      <div className="topbar-user">
        {user && <span>Logged in as <strong>{user.firstName} {user.lastName}</strong></span>}
        <ThemeToggle />
        {actions}
        <button type="button" className="btn btn-ghost" onClick={doLogout}>Log out</button>
      </div>
    </header>
  );
}

export default TopBar;
