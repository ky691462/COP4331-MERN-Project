// Logged-in user, kept per browser tab in sessionStorage (key 'user_data', as in the tutorial).
// The JWT from POST /api/login is stored with it and sent on every game call.
//
// Why sessionStorage and not localStorage: localStorage is shared by every tab in the
// browser, so logging into a second account in another tab silently switched the first
// tab to that account too (and it then "joined" its own room as the host).
// sessionStorage gives each tab its own login, so one browser can hold several players.

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  token: string;
}

const KEY = 'user_data';

// Drop logins saved by the older localStorage version so they can't leak into tabs.
try { localStorage.removeItem(KEY); } catch { /* ignore */ }

export function saveUser(user: User): void {
  try { sessionStorage.setItem(KEY, JSON.stringify(user)); } catch { /* ignore */ }
}

export function getUser(): User | null {
  try {
    const raw = sessionStorage.getItem(KEY);
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
  try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
}
