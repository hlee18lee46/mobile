import http from "./client";

export type LiveGame = {
  gamePk: number;
  date?: string;
  gameDate?: string;
  status?: string;                 // "Scheduled" | "In Progress" | "Final" ...
  inning?: number | null;
  inning_desc?: string;
  balls?: number; strikes?: number; outs?: number;
  bases: { "1B": boolean; "2B": boolean; "3B": boolean };
  batter?: { id: number; name: string } | null;
  pitcher?: { id: number; name: string } | null;
  teams: { home: string; away: string };
  home_RHE: { R: number; H: number; E: number };
  away_RHE: { R: number; H: number; E: number };
  venue?: string | null;
  updatedAt?: string | null;
};

export async function fetchLive(gamePk: number) {
  const r = await http<{ success: boolean; game: LiveGame }>(`/api/games/${gamePk}/live`);
  return r.game;
}
