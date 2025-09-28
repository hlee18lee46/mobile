// src/api/stats.ts
// NOTE: On device, localhost won't work. Point to your deployed base.
// If you want to use your LAN server during dev, swap this at runtime.
const API_BASE = "https://livesports-beta.vercel.app";

export type Team = { id: number; name: string; abbreviation: string; location: string };
export type Player = { id: number; fullName: string; primaryNumber?: string; position?: string };
export type PlayerStat = Record<string, any> | null;

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} ${body}`);
  }
  return (await res.json()) as T;
}

export async function fetchTeams(): Promise<Team[]> {
  const r = await fetch(`${API_BASE}/api/mlb/teams`, { headers: { Accept: "application/json" } });
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

/** Current MLB season helper (NY timezone if you later want to refine pre/post season edge cases) */
export function currentSeason(): number {
  return new Date().getUTCFullYear();
}

/**
 * Fetch season stats for a player.
 * - Tries your DB cache first (PUT to upsert, then GET).
 * - If DB returns null (or endpoint doesn’t support the group yet), falls back to MLB public API.
 * @param playerId MLB player id
 * @param group "hitting" | "pitching"
 * @param season defaults to current year
 */
export async function fetchPlayerSeasonStats(
  playerId: number,
  season = currentSeason(),
  group: "hitting" | "pitching" = "hitting"
): Promise<PlayerStat> {
  // 1) Best-effort refresh on server (ignore failures)
  try {
    await fetch(`${API_BASE}/api/db/player-stats/${playerId}?season=${season}&group=${group}`, {
      method: "PUT",
      headers: { Accept: "application/json" },
    });
  } catch {}

  // 2) Read from DB
  try {
    const r = await fetch(
      `${API_BASE}/api/db/player-stats/${playerId}?season=${season}&group=${group}`,
      { headers: { Accept: "application/json" } }
    );
    if (r.ok) {
      const j = await asJson<{ success: boolean; stat: PlayerStat }>(r);
      if (j?.stat) return j.stat;
    }
  } catch {}

  // 3) Fallback: fetch straight from MLB
  try {
    const mlb = await fetch(
      `https://statsapi.mlb.com/api/v1/people/${playerId}/stats?stats=season&season=${season}&sportId=1&group=${group}`
    );
    if (!mlb.ok) return null;
    const j = await mlb.json();
    const stat = j?.stats?.[0]?.splits?.[0]?.stat ?? null;
    return stat ?? null;
  } catch {
    return null;
  }
}

/** Pretty “slash line” for hitters if available */
export function slashLine(stat: PlayerStat) {
  if (!stat) return null;
  const avg = stat.avg ?? stat.battingAverage;
  const obp = stat.obp ?? stat.onBasePercentage;
  const slg = stat.slg ?? stat.sluggingPercentage;
  if (avg && obp && slg) return `${avg}/${obp}/${slg}`;
  return null;
}
