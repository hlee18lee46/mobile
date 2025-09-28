// src/api/mlb.ts
import { API_BASE } from "../config/env";

export type TeamSide = { name: string; score?: number | null };
export type Game = {
  _id?: string;
  id?: string | number;
  gamePk?: number;
  date: string;                // "YYYY-MM-DD"
  startTime?: string | null;   // ISO
  status: string;              // "Scheduled" | "In Progress" | "Final" | etc.
  home: TeamSide;
  away: TeamSide;
  venue?: string | null;
  inning_desc?: string | null; // e.g. "Top 5th"
};

async function http<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

const toISO = (d: Date) =>
  new Date(d).toLocaleDateString("en-CA", { timeZone: "America/New_York" }); // YYYY-MM-DD

function normalize(g: any, i: number): Game {
  return {
    _id: g._id,
    id: g.id ?? g.gamePk ?? i,
    gamePk: g.gamePk ?? g.id,
    date: g.date,
    startTime: g.gameDate ?? g.startTime ?? null,
    status: String(g.status ?? g.state ?? "Scheduled"),
    home: {
      name: g.teams?.home ?? g.homeTeam ?? g.home?.name,
      score: g.home_RHE?.R ?? g.home?.score ?? null,
    },
    away: {
      name: g.teams?.away ?? g.awayTeam ?? g.away?.name,
      score: g.away_RHE?.R ?? g.away?.score ?? null,
    },
    venue: g.venue ?? null,
    inning_desc: g.inning_desc ?? null,
  };
}

/** Fetch games for "today" (NY time) unless a YYYY-MM-DD override is passed. */
export async function fetchTodayGames(dateOverride?: string): Promise<Game[]> {
  const date = dateOverride || toISO(new Date());
  const res: any = await http(`/api/games?date=${encodeURIComponent(date)}`);

  // Support either { games: [...] } or bare [...] responses
  const arr: any[] = Array.isArray(res) ? res : Array.isArray(res?.games) ? res.games : [];
  return arr.map(normalize);
}

export async function fetchSchedule(days: number): Promise<Game[]> {
  const from = toISO(new Date());
  const to = toISO(new Date(Date.now() + days * 86_400_000));
  const res: any = await http(`/api/games?from=${from}&to=${to}`);

  const arr: any[] = Array.isArray(res) ? res : Array.isArray(res?.games) ? res.games : [];
  return arr.map(normalize);
}
