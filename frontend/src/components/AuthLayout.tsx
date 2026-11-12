import type { ReactNode } from 'react';
import Wordmark from './Wordmark';
import ThemeToggle from './ThemeToggle';

// The five word cards everyone is dealt; one of them is different.
const CARDS = ['pizza', 'pizza', 'pizza', 'pasta', 'pizza'];

// Shared frame for Login, Register and the login error page.
function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="auth">
      <header className="stage">
        <Wordmark size="lg" />
        <p className="stage-line">Everyone gets the same word except one player. Talk it out and find them.</p>
        <ul className="deal" aria-hidden="true">
          {CARDS.map((word, i) => (
            <li key={i} className={word === 'pizza' ? 'deal-card' : 'deal-card deal-odd'}>
              {word}
            </li>
          ))}
        </ul>
      </header>
      <main className="panel-wrap">
        <ThemeToggle className="corner-toggle" />
        <section className="panel" aria-labelledby="page-title">
          <h1 id="page-title">{title}</h1>
          {children}
        </section>
      </main>
    </div>
  );
}

export default AuthLayout;
