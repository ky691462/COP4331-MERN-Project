import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Field from '../components/Field';
import ThemePicker from '../components/ThemePicker';
import TopBar from '../components/TopBar';
import HolidayDecor from '../components/HolidayDecor';
import { createGame, getThemes, joinGame, type Theme } from '../lib/api';
import { getUser } from '../lib/auth';
import { useHoliday } from '../lib/holiday';
import { useIdleLogout } from '../lib/useIdleLogout';

// Main application page shown after a successful login.
function HomePage() {
  const navigate = useNavigate();
  const user = getUser();
  const [params] = useSearchParams();
  useIdleLogout();

  // Host state
  const [themes, setThemes] = useState<Theme[]>([]);
  const [theme, setTheme] = useState('classic');
  const [hostNick, setHostNick] = useState(user?.firstName ?? '');
  const [hostMsg, setHostMsg] = useState('');
  const [hosting, setHosting] = useState(false);

  // Join state
  // Prefilled when someone arrives by scanning a room QR code (/home?join=CODE).
  const [joinCode, setJoinCode] = useState((params.get('join') ?? '').toUpperCase().slice(0, 8));
  const [nickname, setNickname] = useState(user?.firstName ?? '');
  const [joinMsg, setJoinMsg] = useState(params.get('ended') ? 'That game has ended.' : '');
  const [joining, setJoining] = useState(false);

  // Picking a holiday theme previews its look right away.
  useHoliday(theme);

  useEffect(() => {
    getThemes()
      .then((res) => {
        setThemes(res.themes);
        if (res.featured[0]) setTheme(res.featured[0]); // in-season holiday first
      })
      .catch(() => setHostMsg('Could not load the word themes. Refresh to try again.'));
  }, []);

  if (!user) return null;

  async function doHost(event: FormEvent) {
    event.preventDefault();
    setHosting(true);
    setHostMsg('');
    try {
      const game = await createGame(theme, hostNick.trim());
      navigate(`/game/${game.code}`);
    } catch (err) {
      setHostMsg(err instanceof Error ? err.message : 'Could not create a room.');
      setHosting(false);
    }
  }

  async function doJoin(event: FormEvent) {
    event.preventDefault();
    setJoinMsg('');
    const code = joinCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{4,8}$/.test(code)) {
      setJoinMsg('Room codes are 4–8 letters or numbers.');
      return;
    }
    setJoining(true);
    try {
      const game = await joinGame(code, nickname.trim());
      navigate(`/game/${game.code}`);
    } catch (err) {
      setJoinMsg(err instanceof Error ? err.message : 'Could not join that room.');
      setJoining(false);
    }
  }

  return (
    <div className="app">
      <HolidayDecor themeId={theme} />
      <TopBar />

      <main className="home">
        <h1>Ready to play, {user.firstName}?</h1>
        <p className="lede">Host a room and share the code, or join a friend's game.</p>

        <div className="grid">
          <section className="panel panel-host" aria-labelledby="host-title">
            <h2 id="host-title">Host a game</h2>
            <p>Pick a theme for the secret words, then share your room code.</p>
            <form onSubmit={doHost}>
              {themes.length > 0 && <ThemePicker themes={themes} value={theme} onChange={setTheme} />}
              <Field id="hostNick" label="Your nickname" required maxLength={20}
                value={hostNick} onChange={(e) => setHostNick(e.target.value)} />
              <button type="submit" className="btn btn-primary" disabled={hosting || themes.length === 0}>
                {hosting ? 'Creating room…' : 'Create room'}
              </button>
            </form>
            {hostMsg && <div className="alert alert-error" role="alert">{hostMsg}</div>}
          </section>

          <section className="panel panel-join" aria-labelledby="join-title">
            <h2 id="join-title">Join a game</h2>
            <form onSubmit={doJoin}>
              <Field id="roomCode" label="Room code" required autoComplete="off"
                maxLength={8} className="code-input"
                value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} />
              <Field id="nickname" label="Nickname" required maxLength={20}
                value={nickname} onChange={(e) => setNickname(e.target.value)} />
              <button type="submit" className="btn btn-primary" disabled={joining}>
                {joining ? 'Joining…' : 'Join room'}
              </button>
            </form>
            {joinMsg && <div className="alert alert-error" role="alert">{joinMsg}</div>}
          </section>
        </div>

        <section className="how" aria-labelledby="how-title">
          <h2 id="how-title">How to play</h2>
          <ol>
            <li>Everyone gets the same secret word, except the impostor, who only knows the theme.</li>
            <li>Take turns giving a one-word clue out loud.</li>
            <li>Vote on who you think the impostor is.</li>
          </ol>
        </section>
      </main>
    </div>
  );
}

export default HomePage;
