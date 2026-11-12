import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { ApiError, getGame, type GameState } from './api';

const POLL_MS = 1500;

// Same as the website: ask the server for the game every 1.5 seconds while the
// app is in the foreground. `apply` shows an action's reply right away.
export function useGame(code: string) {
  const [game, setGame] = useState<GameState | null>(null);
  const [gone, setGone] = useState('');
  const [offline, setOffline] = useState(false);
  const alive = useRef(true);
  const active = useRef(AppState.currentState === 'active' || AppState.currentState == null);

  const refresh = useCallback(async () => {
    try {
      const next = await getGame(code);
      if (!alive.current) return;
      setGame(next);
      setOffline(false);
    } catch (err) {
      if (!alive.current) return;
      if (err instanceof ApiError && (err.status === 404 || err.status === 403)) setGone(err.message);
      else if (!(err instanceof ApiError && err.status === 401)) setOffline(true);
    }
  }, [code]);

  useEffect(() => {
    alive.current = true;
    const first = setTimeout(refresh, 0);
    const timer = setInterval(() => { if (active.current) refresh(); }, POLL_MS);
    const sub = AppState.addEventListener('change', (state) => {
      active.current = state === 'active';
      if (active.current) refresh();
    });
    return () => {
      alive.current = false;
      clearTimeout(first);
      clearInterval(timer);
      sub.remove();
    };
  }, [refresh]);

  return { game, apply: setGame, gone, offline };
}
