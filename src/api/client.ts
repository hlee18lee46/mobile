import { API_BASE } from "../config/env";

export default async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });

  const text = await res.text().catch(() => "");

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} at ${path}: ${text.slice(0, 180)}`);
  }

  try {
    return (text ? JSON.parse(text) : {}) as T;
  } catch {
    throw new Error(`Non-JSON at ${path}: ${text.slice(0, 180)}`);
  }
}
