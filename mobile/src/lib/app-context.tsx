import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { setAuthToken, setUnauthorizedHandler } from './api';
import { paletteFor, type Palette } from './colors';
import { getItem, removeItem, setItem } from './storage';

export interface User { id: string; firstName: string; lastName: string; email: string; token: string }
type Mode = 'light' | 'dark';

interface AppState {
  ready: boolean;
  user: User | null;
  signIn: (user: User) => Promise<void>;
  signOut: (reason?: 'expired') => Promise<void>;
  mode: Mode;
  toggleMode: () => void;
  holiday: string | null;
  setHoliday: (themeId: string | null) => void;
  colors: Palette;
}

const AppContext = createContext<AppState | null>(null);
const USER_KEY = 'user_data';
const MODE_KEY = 'theme';

// Login, light/dark mode and the holiday skin, shared by every screen.
export function AppProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [savedMode, setSavedMode] = useState<Mode | null>(null);
  const [holiday, setHoliday] = useState<string | null>(null);

  const mode: Mode = savedMode ?? (system === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    (async () => {
      const [rawUser, rawMode] = await Promise.all([getItem(USER_KEY), getItem(MODE_KEY)]);
      if (rawMode === 'light' || rawMode === 'dark') setSavedMode(rawMode);
      try {
        const saved = rawUser ? (JSON.parse(rawUser) as User) : null;
        if (saved?.token) { setUser(saved); setAuthToken(saved.token); }
      } catch { /* ignore a broken saved login */ }
      setReady(true);
    })();
  }, []);

  const signIn = useCallback(async (next: User) => {
    setAuthToken(next.token);
    setUser(next);
    await setItem(USER_KEY, JSON.stringify(next));
  }, []);

  const signOut = useCallback(async (reason?: 'expired') => {
    setAuthToken(null);
    setUser(null);
    await removeItem(USER_KEY);
    router.replace(reason ? `/login?${reason}=1` : '/login');
  }, []);

  // Any API call that says the login token expired logs the user out.
  useEffect(() => {
    setUnauthorizedHandler(() => { signOut('expired'); });
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const toggleMode = useCallback(() => {
    const next: Mode = mode === 'dark' ? 'light' : 'dark';
    setSavedMode(next);
    setItem(MODE_KEY, next);
  }, [mode]);

  const value = useMemo<AppState>(() => ({
    ready, user, signIn, signOut, mode, toggleMode, holiday, setHoliday,
    colors: paletteFor(mode, holiday),
  }), [ready, user, signIn, signOut, mode, toggleMode, holiday]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

// Apply a holiday skin while a screen is showing.
export function useHolidaySkin(themeId: string | null | undefined) {
  const { setHoliday } = useApp();
  useEffect(() => {
    setHoliday(themeId ?? null);
    return () => setHoliday(null);
  }, [themeId, setHoliday]);
}
