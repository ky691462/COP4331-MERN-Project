// ---------------------------------------------------------------------------
// All API calls for the mobile app. Same API as the website
// (backend: ../backend, spec: ../docs/openapi.yaml).
// ---------------------------------------------------------------------------

// The deployed API by default. For a local backend, start Expo with e.g.
//   EXPO_PUBLIC_API_URL=http://10.0.2.2:5000 npx expo start   (Android emulator)
//   EXPO_PUBLIC_API_URL=http://<your-computer-ip>:5000 npx expo start   (real phone)
export const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? 'https://hammrti.me').replace(/\/$/, '');

// The website, used for the room QR code (so phones without the app can join too).
export const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL ?? 'https://hammrti.me').replace(/\/$/, '');

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(next: string | null) { token = next; }
export function setUnauthorizedHandler(fn: (() => void) | null) { onUnauthorized = fn; }

export class ApiError extends Error {
  status: number;
  data: Record<string, unknown>;
  constructor(status: number, message: string, data: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(method: string, route: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const sentToken = token;
  if (sentToken) headers.Authorization = `Bearer ${sentToken}`;

  let response: Response;
  try {
    response = await fetch(API_BASE + route, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Could not reach the server. Check your connection and try again.');
  }

  let data: Record<string, unknown> = {};
  try { data = await response.json(); } catch { /* empty or non-JSON reply */ }

  if (!response.ok) {
    if (response.status === 401 && sentToken) onUnauthorized?.();
    const message = typeof data.message === 'string' ? data.message : `Server error (${response.status}).`;
    throw new ApiError(response.status, message, data);
  }
  return data as T;
}

// ---- Shapes (same as the website) ----

export interface Message { message: string }
export interface LoginResponse {
  message: string;
  token: string;
  user: { id: string; firstName: string; lastName: string; email: string };
}
export interface RegisterResponse { message: string; userId: string; emailSent: boolean }
export interface Theme {
  id: string;
  name: string;
  kind: 'general' | 'holiday';
  emoji: string;
  description: string;
  wordCount: number;
  inSeason: boolean;
}
export interface ThemesResponse { themes: Theme[]; featured: string[] }
export type GameStatus = 'lobby' | 'reveal' | 'voting' | 'results';
export interface Player { userId: string; nickname: string; score: number; isHost: boolean; hasVoted?: boolean }
export interface GameState {
  code: string;
  status: GameStatus;
  round: number;
  theme: Theme;
  hostId: string;
  minPlayers: number;
  maxPlayers: number;
  players: Player[];
  you: { userId: string; nickname: string; isHost: boolean; isImpostor: boolean; word: string | null; vote: string | null };
  canStart: boolean;
  result: null | {
    impostorId: string;
    impostorNickname: string;
    word: string;
    caught: boolean;
    votes: { userId: string; nickname: string; votes: number; votedFor: string | null }[];
  };
  updatedAt: string;
}

// ---- Auth ----
export const login = (email: string, password: string) =>
  request<LoginResponse>('POST', '/api/login', { email, password });
export const register = (data: { firstName: string; lastName: string; email: string; password: string }) =>
  request<RegisterResponse>('POST', '/api/register', data);
export const resendVerification = (email: string) =>
  request<Message>('POST', '/api/resend-verification', { email });
export const forgotPassword = (email: string) =>
  request<Message>('POST', '/api/forgot-password', { email });

// ---- Themes and games ----
const g = (code: string) => `/api/games/${encodeURIComponent(code)}`;
export const getThemes = () => request<ThemesResponse>('GET', '/api/themes');
export const createGame = (theme: string, nickname: string) =>
  request<GameState>('POST', '/api/games', { theme, nickname });
export const joinGame = (code: string, nickname: string) =>
  request<GameState>('POST', '/api/games/join', { code, nickname });
export const getGame = (code: string) => request<GameState>('GET', g(code));
export const setGameTheme = (code: string, theme: string) =>
  request<GameState>('PUT', `${g(code)}/theme`, { theme });
export const startRound = (code: string) => request<GameState>('POST', `${g(code)}/start`);
export const openVoting = (code: string) => request<GameState>('POST', `${g(code)}/voting`);
export const castVote = (code: string, targetId: string) =>
  request<GameState>('POST', `${g(code)}/vote`, { targetId });
export const finishVoting = (code: string) => request<GameState>('POST', `${g(code)}/finish`);
export const leaveGame = (code: string) => request<Message>('POST', `${g(code)}/leave`);

// Room code from a scanned QR: the website's join link (…/home?join=CODE)
// or just the code itself.
export function codeFromScan(data: string): string | null {
  const fromLink = data.match(/[?&]join=([A-Za-z0-9]{4,8})/);
  if (fromLink) return fromLink[1].toUpperCase();
  const bare = data.trim().toUpperCase();
  return /^[A-Z0-9]{4,8}$/.test(bare) ? bare : null;
}
