// ---------------------------------------------------------------------------
// All API calls live here (backend: ../backend, spec: ../docs/openapi.yaml).
// Errors come back as { message } with an HTTP error status; request() turns
// those into an ApiError so pages can just show error.message.
// ---------------------------------------------------------------------------
import { clearUser, getToken } from './auth';

// Where the API lives.
//  - Local dev (npm run dev): http://localhost:5000, like the tutorial.
//  - Production (npm run build, served by nginx at hammrti.me): same origin,
//    so requests go to https://hammrti.me/api/... and nginx forwards them to Node.
// Override either one by setting VITE_API_URL in a .env file.
const API_BASE: string =
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:5000' : '');

export function buildPath(route: string): string {
  return API_BASE + route;
}

export class ApiError extends Error {
  status: number;
  data: Record<string, unknown>;
  constructor(status: number, message: string, data: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

// AJAX via fetch. Sends the login token when there is one.
async function request<T>(method: string, route: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(buildPath(route), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Could not reach the server. Check your connection and try again.');
  }

  let data: Record<string, unknown> = {};
  try {
    data = await response.json();
  } catch {
    /* empty or non-JSON reply */
  }

  if (!response.ok) {
    // Token expired or invalid on a logged-in call: log out.
    if (response.status === 401 && token) {
      clearUser();
      window.location.assign('/?expired=1');
    }
    const message = typeof data.message === 'string' ? data.message : `Server error (${response.status}).`;
    throw new ApiError(response.status, message, data);
  }
  return data as T;
}

// ---- Shapes ----

export interface Message { message: string }

export interface LoginResponse {
  message: string;
  token: string;
  user: { id: string; firstName: string; lastName: string; email: string };
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
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

export interface Player {
  userId: string;
  nickname: string;
  score: number;
  isHost: boolean;
  hasVoted?: boolean;
}

export interface GameState {
  code: string;
  status: GameStatus;
  round: number;
  theme: Theme;
  hostId: string;
  minPlayers: number;
  maxPlayers: number;
  players: Player[];
  you: {
    userId: string;
    nickname: string;
    isHost: boolean;
    isImpostor: boolean;
    word: string | null;
    vote: string | null;
  };
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

export const register = (data: RegisterRequest) =>
  request<RegisterResponse>('POST', '/api/register', data);

export const verifyEmail = (token: string) =>
  request<Message>('POST', '/api/verify-email', { token });

export const resendVerification = (email: string) =>
  request<Message>('POST', '/api/resend-verification', { email });

export const forgotPassword = (email: string) =>
  request<Message>('POST', '/api/forgot-password', { email });

export const resetPassword = (token: string, password: string) =>
  request<Message>('POST', '/api/reset-password', { token, password });

// ---- Themes and games ----

export const getThemes = () => request<ThemesResponse>('GET', '/api/themes');

export const createGame = (theme: string, nickname: string) =>
  request<GameState>('POST', '/api/games', { theme, nickname });

export const joinGame = (code: string, nickname: string) =>
  request<GameState>('POST', '/api/games/join', { code, nickname });

export const getGame = (code: string) =>
  request<GameState>('GET', `/api/games/${encodeURIComponent(code)}`);

export const setGameTheme = (code: string, theme: string) =>
  request<GameState>('PUT', `/api/games/${encodeURIComponent(code)}/theme`, { theme });

export const startRound = (code: string) =>
  request<GameState>('POST', `/api/games/${encodeURIComponent(code)}/start`);

export const openVoting = (code: string) =>
  request<GameState>('POST', `/api/games/${encodeURIComponent(code)}/voting`);

export const castVote = (code: string, targetId: string) =>
  request<GameState>('POST', `/api/games/${encodeURIComponent(code)}/vote`, { targetId });

export const finishVoting = (code: string) =>
  request<GameState>('POST', `/api/games/${encodeURIComponent(code)}/finish`);

export const leaveGame = (code: string) =>
  request<Message>('POST', `/api/games/${encodeURIComponent(code)}/leave`);
