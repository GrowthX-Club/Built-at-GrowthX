// All API calls go through Next.js rewrites (see next.config.mjs)
// /api/bx/* → gx-backend /bx/*
// This avoids CORS issues and keeps the backend URL hidden from the client.

export function bxApi(path: string, init?: RequestInit) {
  return fetch(`/api/bx${path}`, {
    credentials: "include",
    ...init,
  });
}

export function gxApi(path: string, init?: RequestInit) {
  return fetch(`/api${path}`, {
    credentials: "include",
    ...init,
  });
}
