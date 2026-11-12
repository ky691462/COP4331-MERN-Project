import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import CodeTiles from '../components/CodeTiles';
import JoinQR from '../components/JoinQR';
import ThemePicker from '../components/ThemePicker';
import HolidayDecor from '../components/HolidayDecor';
import {
  castVote, finishVoting, getThemes, leaveGame, openVoting, setGameTheme, startRound,
  type GameState, type Theme,
} from '../lib/api';
import { useGame } from '../lib/useGame';
import { useHoliday } from '../lib/holiday';
import { useIdleLogout } from '../lib/useIdleLogout';

// One page for the whole game; what it shows follows game.status:
// lobby -> reveal (see your word, give clues out loud) -> voting -> results -> next round.
function GamePage() {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const { game, apply, gone, offline } = useGame(code.toUpperCase());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [themes, setThemes] = useState<Theme[]>([]);
  useIdleLogout();
  useHoliday(game?.theme.id);

  useEffect(() => {
    getThemes().then((res) => setThemes(res.themes)).catch(() => { /* picker just won't show */ });
  }, []);

  // Run a game action; its reply replaces the state right away.
  async function act(action: () => Promise<GameState>) {
    setBusy(true);
    setError('');
    try {
      apply(await action());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  async function doLeave() {
    try { await leaveGame(code); } catch { /* leaving anyway */ }
    navigate('/home');
  }

  const leaveButton = (
    <button type="button" className="btn btn-ghost" onClick={doLeave}>Leave game</button>
  );

  if (gone) {
    return (
      <div className="app">
        <TopBar />
        <main className="home">
          <h1>This game is over</h1>
          <p className="lede">{gone}</p>
          <Link to="/home" className="btn btn-secondary btn-inline">Back to home</Link>
        </main>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="app">
        <TopBar />
        <main className="home"><p className="lede" role="status">Loading the game…</p></main>
      </div>
    );
  }

  const host = game.players.find((p) => p.isHost);
  const hostName = game.you.isHost ? 'you' : host?.nickname ?? 'the host';

  return (
    <div className="app">
      <HolidayDecor themeId={game.theme.id} />
      <TopBar actions={leaveButton} />

      <main className="home game">
        <div className="game-meta">
          <span className="chip chip-theme"><span aria-hidden="true">{game.theme.emoji}</span> {game.theme.name}</span>
          <span className="chip">Room <strong>{game.code}</strong></span>
          {game.round > 0 && <span className="chip">Round {game.round}</span>}
        </div>

        {offline && <div className="alert alert-info" role="status">Reconnecting to the server…</div>}
        {error && <div className="alert alert-error" role="alert">{error}</div>}

        {game.status === 'lobby' && (
          <Lobby game={game} themes={themes} busy={busy} hostName={hostName}
            onTheme={(t) => act(() => setGameTheme(game.code, t))}
            onStart={() => act(() => startRound(game.code))} />
        )}
        {game.status === 'reveal' && (
          <Reveal game={game} busy={busy} hostName={hostName}
            onVote={() => act(() => openVoting(game.code))} />
        )}
        {game.status === 'voting' && (
          <Voting game={game} busy={busy}
            onVote={(id) => act(() => castVote(game.code, id))}
            onFinish={() => act(() => finishVoting(game.code))} />
        )}
        {game.status === 'results' && (
          <Results game={game} themes={themes} busy={busy} hostName={hostName}
            onTheme={(t) => act(() => setGameTheme(game.code, t))}
            onNext={() => act(() => startRound(game.code))} />
        )}
      </main>
    </div>
  );
}

// ---------- Lobby ----------
function Lobby({ game, themes, busy, hostName, onTheme, onStart }: {
  game: GameState; themes: Theme[]; busy: boolean; hostName: string;
  onTheme: (id: string) => void; onStart: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const missing = Math.max(0, game.minPlayers - game.players.length);

  async function copyCode() {
    try { await navigator.clipboard.writeText(game.code); setCopied(true); } catch { setCopied(false); }
  }

  return (
    <>
      <h1>{game.you.isHost ? 'Your room is open' : 'You’re in!'}</h1>
      <p className="lede">
        {game.you.isHost
          ? 'Share the code. Start when everyone’s here.'
          : `Waiting for ${hostName} to start the game.`}
      </p>

      <div className="grid">
        <section className="panel panel-host" aria-labelledby="code-title">
          <h2 id="code-title">Room code</h2>
          <div className="room" aria-live="polite">
            <CodeTiles code={game.code} />
            <button type="button" className="btn btn-secondary" onClick={copyCode}>
              {copied ? 'Copied' : 'Copy code'}
            </button>
            <JoinQR code={game.code} />
          </div>
        </section>

        <section className="panel panel-join" aria-labelledby="players-title">
          <h2 id="players-title">Players <span className="count">{game.players.length}/{game.maxPlayers}</span></h2>
          <PlayerList game={game} />
          {game.you.isHost ? (
            <>
              {themes.length > 0 && (
                <ThemePicker themes={themes} value={game.theme.id} onChange={onTheme} disabled={busy} name="lobby-theme" />
              )}
              <button type="button" className="btn btn-primary" onClick={onStart} disabled={busy || !game.canStart}>
                {busy ? 'Dealing…' : 'Start game'}
              </button>
              {missing > 0 && (
                <p className="note">Need {missing} more {missing === 1 ? 'player' : 'players'} to start (minimum {game.minPlayers}).</p>
              )}
            </>
          ) : (
            <p className="note">The host picks the theme and starts the round.</p>
          )}
        </section>
      </div>
    </>
  );
}

// ---------- Reveal: see your word, give clues out loud ----------
function Reveal({ game, busy, hostName, onVote }: {
  game: GameState; busy: boolean; hostName: string; onVote: () => void;
}) {
  // Hidden by default so people next to you can't peek.
  const [shown, setShown] = useState(false);
  const { isImpostor, word } = game.you;

  return (
    <>
      <h1>Your secret</h1>
      <p className="lede">Tap the card to see it. Then take turns giving a one-word clue out loud.</p>

      <div className="reveal">
        <button type="button" className={`word-card ${shown ? 'is-shown' : ''} ${shown && isImpostor ? 'is-impostor' : ''}`}
          onClick={() => setShown(!shown)} aria-pressed={shown}
          aria-label={shown ? 'Hide your word' : 'Show your word'}>
          {!shown && <span className="word-back">Tap to reveal</span>}
          {shown && !isImpostor && (
            <>
              <span className="word-label">Your word</span>
              <span className="word">{word}</span>
              <span className="word-hint">Don’t say it! Hint at it.</span>
            </>
          )}
          {shown && isImpostor && (
            <>
              <span className="word-label">You are</span>
              <span className="word">the impostor</span>
              <span className="word-hint">Theme: {game.theme.emoji} {game.theme.name}. Blend in.</span>
            </>
          )}
        </button>

        <section className="panel panel-join reveal-side" aria-labelledby="round-title">
          <h2 id="round-title">Round {game.round}</h2>
          <PlayerList game={game} />
          {game.you.isHost ? (
            <button type="button" className="btn btn-primary" onClick={onVote} disabled={busy}>
              Everyone’s given a clue: vote
            </button>
          ) : (
            <p className="note">When everyone has given a clue, {hostName} opens the vote.</p>
          )}
        </section>
      </div>
    </>
  );
}

// ---------- Voting ----------
function Voting({ game, busy, onVote, onFinish }: {
  game: GameState; busy: boolean; onVote: (id: string) => void; onFinish: () => void;
}) {
  const voted = game.players.filter((p) => p.hasVoted).length;
  const others = game.players.filter((p) => p.userId !== game.you.userId);

  return (
    <>
      <h1>Who’s the impostor?</h1>
      <p className="lede">
        {game.you.vote ? 'Vote counted. You can change it until everyone has voted.' : 'Pick the player you think didn’t know the word.'}
      </p>

      <ul className="vote-grid" aria-label="Players to vote for">
        {others.map((p) => {
          const mine = game.you.vote === p.userId;
          return (
            <li key={p.userId}>
              <button type="button" className={`vote-card ${mine ? 'is-mine' : ''}`} disabled={busy}
                aria-pressed={mine} onClick={() => onVote(p.userId)}>
                <span className="vote-name">{p.nickname}</span>
                <span className="vote-state">{mine ? 'Your vote' : 'Vote'}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="vote-progress" role="status">
        <strong>{voted} of {game.players.length}</strong> have voted
        <ul className="dots" aria-hidden="true">
          {game.players.map((p) => <li key={p.userId} className={p.hasVoted ? 'on' : ''} title={p.nickname} />)}
        </ul>
      </div>
      {game.you.isHost && voted < game.players.length && (
        <button type="button" className="btn btn-secondary btn-inline" onClick={onFinish} disabled={busy}>
          End the vote now
        </button>
      )}
    </>
  );
}

// ---------- Results ----------
function Results({ game, themes, busy, hostName, onTheme, onNext }: {
  game: GameState; themes: Theme[]; busy: boolean; hostName: string;
  onTheme: (id: string) => void; onNext: () => void;
}) {
  const r = game.result!;
  const youWereIt = r.impostorId === game.you.userId;
  const nameOf = (id: string | null) => game.players.find((p) => p.userId === id)?.nickname ?? '—';
  const most = Math.max(1, ...r.votes.map((v) => v.votes));
  const ranking = [...game.players].sort((a, b) => b.score - a.score);

  return (
    <>
      <h1>{r.caught ? 'Impostor caught!' : 'The impostor got away!'}</h1>
      <p className="lede">
        {youWereIt ? 'You were' : <><strong>{r.impostorNickname}</strong> was</>} the impostor. The word was <strong>{r.word}</strong>.
      </p>

      <div className="grid">
        <section className="panel panel-host" aria-labelledby="votes-title">
          <h2 id="votes-title">Votes</h2>
          <ul className="tally">
            {r.votes.map((v) => (
              <li key={v.userId} className={v.userId === r.impostorId ? 'is-impostor' : ''}>
                <span className="tally-name">
                  {v.nickname}{v.userId === r.impostorId && <span className="tag">Impostor</span>}
                </span>
                <span className="tally-bar"><span style={{ width: `${(v.votes / most) * 100}%` }} /></span>
                <span className="tally-num">{v.votes}</span>
                <span className="tally-for">voted for {nameOf(v.votedFor)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel panel-join" aria-labelledby="score-title">
          <h2 id="score-title">Scores</h2>
          <ol className="scores">
            {ranking.map((p) => (
              <li key={p.userId}><span>{p.nickname}{p.userId === game.you.userId && ' (you)'}</span><strong>{p.score}</strong></li>
            ))}
          </ol>
          <p className="note">Catch the impostor: +1 for each correct vote. Impostor escapes: +2.</p>
          {game.you.isHost ? (
            <>
              {themes.length > 0 && (
                <ThemePicker themes={themes} value={game.theme.id} onChange={onTheme} disabled={busy} name="next-theme" />
              )}
              <button type="button" className="btn btn-primary" onClick={onNext} disabled={busy || !game.canStart}>
                {busy ? 'Dealing…' : 'Play another round'}
              </button>
              {!game.canStart && <p className="note">Need at least {game.minPlayers} players for another round.</p>}
            </>
          ) : (
            <p className="note">Waiting for {hostName} to start the next round. New players can join now.</p>
          )}
        </section>
      </div>
    </>
  );
}

function PlayerList({ game }: { game: GameState }) {
  return (
    <ul className="players" aria-label="Players in room">
      {game.players.map((p) => (
        <li key={p.userId}>
          {p.nickname}
          {p.isHost && <span className="tag">Host</span>}
          {p.userId === game.you.userId && <span className="sr-only"> (you)</span>}
        </li>
      ))}
    </ul>
  );
}

export default GamePage;
