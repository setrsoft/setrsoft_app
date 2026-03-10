/**
 * API client placeholder. Replace with axios instance or fetch wrapper when backend is ready.
 */
const API_BASE = import.meta.env.VITE_API_BASE ?? '';

export const apiClient = {
  get baseUrl() {
    return API_BASE;
  },
  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<T>;
  },
  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<T>;
  },
};
