// src/api/quiz.ts
const API = "https://livesports-beta.vercel.app"; // or your localhost
export async function createPlayerQuiz(gamePk: number, playerId: number, season: number, role: "batter"|"pitcher") {
  const r = await fetch(`${API}/api/quiz/player`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ gamePk, playerId, season, role }),
  });
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()) as { success: boolean; pollId: string; poll: any };
}

export async function votePoll(pollId: string, userId: string, choiceIndex: number) {
  const r = await fetch(`${API}/api/polls/${pollId}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ userId, choiceIndex }),
  });
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()) as { success: boolean; tallies: number[] };
}

export async function listPolls(gamePk: number) {
  const r = await fetch(`${API}/api/polls?gamePk=${gamePk}`, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()) as { success: boolean; polls: any[] };
}
