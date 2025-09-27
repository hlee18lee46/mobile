import http from "./client";
import { MLB_ENDPOINTS } from "../config/env";

export type Game = {
  _id?: string;            // ← add this line
  id?: string | number;
  gamePk?: number;
  date: string;
  startTime?: string;
  status: "scheduled" | "in_progress" | "final" | string;
  home: { name: string; score?: number };
  away: { name: string; score?: number };
  venue?: string | null;
};


type GamesEnvelope = { success?: boolean; games?: Game[] } | { games: Game[] };

export function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function toGames(payload: GamesEnvelope): Game[] {
  if (payload && (payload as any).games && Array.isArray((payload as any).games)) {
    return (payload as any).games as Game[];
  }
  return [];
}

export async function fetchTodayGames(): Promise<Game[]> {
  const today = formatDate(new Date());
  const data = await http<GamesEnvelope>(MLB_ENDPOINTS.today(today));
  return toGames(data);
}

export async function fetchSchedule(daysAhead = 7): Promise<Game[]> {
  const now = new Date();
  const from = formatDate(now);
  const toD = new Date(now); toD.setDate(now.getDate() + daysAhead);
  const to = formatDate(toD);
  const data = await http<GamesEnvelope>(MLB_ENDPOINTS.schedule(from, to));
  return toGames(data);
}
