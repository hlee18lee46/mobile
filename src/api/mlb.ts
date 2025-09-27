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

async function http<T>(path: string, init?: RequestInit): Promise<T> {
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

const toISO = (d: Date) => new Date(d).toLocaleDateString("en-CA", { timeZone: "America/New_York" }); // YYYY-MM-DD

export async function fetchTodayGames(): Promise<Game[]> {
  const date = toISO(new Date());
  const data = await http<{ success: boolean; games: any[] }>(`/api/games?date=${date}`);
  // Normalize server docs → Game[]
  return (data.games || []).map((g, i) => ({
    _id: g._id,
    id: g.id ?? g.gamePk ?? i,
    gamePk: g.gamePk ?? g.id,
    date: g.date,
    startTime: g.gameDate ?? g.startTime ?? null,
    status: String(g.status ?? g.state ?? "Scheduled"),
    home: { name: g.teams?.home ?? g.homeTeam ?? g.home?.name, score: g.home_RHE?.R ?? g.home?.score ?? null },
    away: { name: g.teams?.away ?? g.awayTeam ?? g.away?.name, score: g.away_RHE?.R ?? g.away?.score ?? null },
    venue: g.venue ?? null,
    inning_desc: g.inning_desc ?? null,
  }));
}

export async function fetchSchedule(days: number): Promise<Game[]> {
  const from = toISO(new Date());
  const to = toISO(new Date(Date.now() + days * 86400_000));
  const data = await http<{ success: boolean; games: any[] }>(`/api/games?from=${from}&to=${to}`);
  return (data.games || []).map((g, i) => ({
    _id: g._id,
    id: g.id ?? g.gamePk ?? i,
    gamePk: g.gamePk ?? g.id,
    date: g.date,
    startTime: g.gameDate ?? g.startTime ?? null,
    status: String(g.status ?? g.state ?? "Scheduled"),
    home: { name: g.teams?.home ?? g.homeTeam ?? g.home?.name, score: g.home_RHE?.R ?? g.home?.score ?? null },
    away: { name: g.teams?.away ?? g.awayTeam ?? g.away?.name, score: g.away_RHE?.R ?? g.away?.score ?? null },
    venue: g.venue ?? null,
    inning_desc: g.inning_desc ?? null,
  }));
}
