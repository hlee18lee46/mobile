// src/api/quiz.ts
const API_BASE = "https://livesports-beta.vercel.app";

export type Quiz = {
  quizId: string;
  gamePk: number;
  question: string;
  options: string[];
  createdAt?: string;
  expiresAt?: string | null;
  correctIndex?: number | null; // usually omitted until reveal server-side
};

export type LeaderRow = { name: string; score: number; updatedAt?: string };

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} ${body}`);
  }
  return (await res.json()) as T;
}

/** Get the latest quiz (server can rotate it every ~30s, only trivia/stat types) */
export async function fetchLatestQuiz(gamePk: number): Promise<Quiz | null> {
  const r = await fetch(`${API_BASE}/api/engagement/quiz/${gamePk}/latest`, {
    headers: { Accept: "application/json" },
  });
  const data = await asJson<{ success: boolean; quiz: Quiz | null }>(r);
  return data.quiz ?? null;
}

/** Cast a vote for an option index */
export async function voteQuiz(
  gamePk: number,
  quizId: string,
  name: string,
  optionIndex: number
): Promise<{ correct: boolean; correctIndex: number | null; myScore: number }> {
  const r = await fetch(`${API_BASE}/api/engagement/quiz/${gamePk}/${quizId}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ name, optionIndex }),
  });
  const data = await asJson<{
    success: boolean;
    correct: boolean;
    correctIndex: number | null;
    myScore: number;
  }>(r);
  return { correct: data.correct, correctIndex: data.correctIndex, myScore: data.myScore };
}

/** Top N users by score (use every ~2 minutes) */
export async function fetchLeaderboard(
  gamePk: number,
  limit = 5
): Promise<LeaderRow[]> {
  const r = await fetch(
    `${API_BASE}/api/engagement/quiz/${gamePk}/leaderboard?limit=${limit}`,
    { headers: { Accept: "application/json" } }
  );
  const data = await asJson<{ success: boolean; top: LeaderRow[] }>(r);
  return data.top ?? [];
}
