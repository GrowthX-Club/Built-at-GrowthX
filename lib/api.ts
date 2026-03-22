import { mockBxApi, mockGxApi } from './mock-api/index';

const API_BASE = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_URL : process.env.VITE_API_URL) || 'http://localhost:8000/api/v1';
const MOCK_MODE = ((typeof import.meta !== 'undefined' ? import.meta.env?.VITE_MOCK_MODE : process.env.VITE_MOCK_MODE) === 'true');

const TOKEN_KEY = 'bx_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(init?: RequestInit): RequestInit {
  const token = getToken();
  if (!token) return init || {};
  const headers = new Headers(init?.headers);
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return { ...init, headers };
}

export function bxApi(path: string, init?: RequestInit): Promise<Response> {
  if (MOCK_MODE) {
    const res = mockBxApi(path, init);
    if (res) return Promise.resolve(res);
  }
  return fetch(`${API_BASE}/bx${path}`, authHeaders(init));
}

export function gxApi(path: string, init?: RequestInit): Promise<Response> {
  if (MOCK_MODE) {
    const res = mockGxApi(path, init);
    if (res) return Promise.resolve(res);
  }
  return fetch(`${API_BASE}${path}`, authHeaders(init));
}
