// src/api/stats.ts
// src/api/stats.ts
const API_BASE = "https://livesports-beta.vercel.app";

export type Team = { id: number; name: string; abbreviation: string; location: string };
export type Player = { id: number; fullName: string; primaryNumber?: string; position?: string };
export type PlayerStat = Record<string, any>;

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} ${body}`);
  }
  return (await res.json()) as T;
}

export async function fetchTeams(): Promise<Team[]> {
  const r = await fetch(`${API_BASE}/api/mlb/teams`, {
    headers: { Accept: "application/json" },
  });
  const data = await asJson<{ success: boolean; teams: Team[] }>(r);
  return data.teams ?? [];
}

export async function fetchTeamPlayers(teamId: number): Promise<Player[]> {
  const r = await fetch(`${API_BASE}/api/mlb/team-players?teamId=${teamId}`, {
    headers: { Accept: "application/json" },
  });
  const data = await asJson<{ success: boolean; players: Player[] }>(r);
  return data.players ?? [];
}

/** Upserts latest stat in Mongo, then reads it back */
export async function fetchPlayerSeasonStats(
  playerId: number,
  season: number
): Promise<PlayerStat | null> {
  // Try to refresh cache on server (ignore failure so UI can still read existing doc)
  try {
    await fetch(`${API_BASE}/api/db/player-stats/${playerId}?season=${season}`, {
      method: "PUT",
      headers: { Accept: "application/json" },
    });
  } catch {}

  const r = await fetch(`${API_BASE}/api/db/player-stats/${playerId}?season=${season}`, {
    headers: { Accept: "application/json" },
  });
  const data = await asJson<{
    success: boolean;
    playerId: number;
    season: number;
    stat: PlayerStat | null;
  }>(r);
  return data.stat ?? null;
}
