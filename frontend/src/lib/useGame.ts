import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, getGame, type GameState } from './api';

const POLL_MS = 1500;

// Keeps a game's state fresh by asking the server every 1.5 seconds
// (paused while the tab is hidden). `apply` lets an action's reply update the
// screen immediately instead of waiting for the next check.
export function useGame(code: string) {
  const [game, setGame] = useState<GameState | null>(null);
  const [gone, setGone] = useState(''); // set when the game ended or we're not in it
  const [offline, setOffline] = useState(false);
  const alive = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const next = await getGame(code);
      if (!alive.current) return;
      setGame(next);
      setOffline(false);
    } catch (err) {
      if (!alive.current) return;
      if (err instanceof ApiError && (err.status === 404 || err.status === 403)) setGone(err.message);
      else setOffline(true);
    }
  }, [code]);

  useEffect(() => {
    alive.current = true;
    const first = window.setTimeout(refresh, 0); // load right away
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, POLL_MS);
    const onShow = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onShow);
    return () => {
      alive.current = false;
      window.clearTimeout(first);
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onShow);
    };
  }, [refresh]);

  return { game, apply: setGame, gone, offline, refresh };
}
