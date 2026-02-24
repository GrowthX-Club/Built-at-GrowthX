const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export function bxApi(path: string, init?: RequestInit) {
  return fetch(`${API_BASE}/bx${path}`, {
    credentials: "include",
    ...init,
  });
}

export function gxApi(path: string, init?: RequestInit) {
  return fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
  });
}
