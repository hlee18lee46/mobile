import { API_BASE } from "../config/env";

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
  return res.json() as Promise<T>;
}

export type ChatMsg = { _id?: string; gamePk: number; name: string; text: string; ts: string };

export async function fetchChat(gamePk: number, since?: string) {
  const url = since ? `/api/chat/${gamePk}?since=${encodeURIComponent(since)}` : `/api/chat/${gamePk}`;
  const r = await http<{ success:boolean; messages: ChatMsg[] }>(url);
  return r.messages;
}

export async function sendChat(gamePk: number, name: string, text: string) {
  return http<{ success:boolean }>(`/api/chat/${gamePk}`, {
    method: "POST",
    body: JSON.stringify({ name, text }),
  });
}
