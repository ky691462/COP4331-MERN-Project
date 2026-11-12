import { useState } from 'react';
import { getTheme, setTheme, type Theme } from '../lib/theme';

function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setLocal] = useState<Theme>(getTheme());
  const next: Theme = theme === 'dark' ? 'light' : 'dark';

  function toggle() {
    setTheme(next);
    setLocal(next);
  }

  return (
    <button type="button" className={`btn btn-ghost theme-toggle ${className}`} onClick={toggle}
      aria-label={`Switch to ${next} mode`}>
      <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  );
}

export default ThemeToggle;
