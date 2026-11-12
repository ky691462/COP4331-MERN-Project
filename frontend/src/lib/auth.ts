// Logged-in user kept in localStorage, same key as the tutorial ('user_data').
// The JWT from POST /api/login is stored with it and sent on every game call.

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  token: string;
}

const KEY = 'user_data';

export function saveUser(user: User): void {
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function getUser(): User | null {
  try {
    const raw = localStorage.getItem(KEY);
    const user = raw ? (JSON.parse(raw) as User) : null;
    return user && user.token ? user : null; // ignore old logins from before tokens
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return getUser()?.token ?? null;
}

export function clearUser(): void {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
