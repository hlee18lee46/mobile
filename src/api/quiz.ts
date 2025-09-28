// src/api/quiz.ts
const API_BASE = "https://livesports-beta.vercel.app";

export type Quiz = {
  quizId: string;
  gamePk: number;
  question: string;
  options: string[];
  createdAt?: string;
  revealAt?: string | null;      // client can schedule 5s reveal UI if present
  expiresAt?: string | null;
  correctIndex?: number | null;  // usually omitted until reveal
};

export type LeaderRow = { name: string; score: number; updatedAt?: string };

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} ${body}`);
  }
  return (await res.json()) as T;
}

function withTimeout(ms = 8000): { signal: AbortSignal; cancel: () => void } {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, cancel: () => clearTimeout(id) };
}

// Simple cache-buster for RN (since fetch init.cache isn't supported)
function bust(url: string) {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}_ts=${Date.now()}`;
}

/** Get the latest quiz */
export async function fetchLatestQuiz(gamePk: number): Promise<Quiz | null> {
  const { signal, cancel } = withTimeout();
  try {
    const r = await fetch(
      bust(`${API_BASE}/api/engagement/quiz/${gamePk}/latest`),
      { headers: { Accept: "application/json" }, signal }
    );
    const data = await asJson<{ success: boolean; quiz: Quiz | null }>(r);
    return data.quiz ?? null;
  } finally {
    cancel();
  }
}

/** Cast a vote for an option index */
export async function voteQuiz(
  gamePk: number,
  quizId: string,
  name: string,
  optionIndex: number
): Promise<{ correct: boolean; correctIndex: number | null; myScore: number }> {
  const { signal, cancel } = withTimeout();
  try {
    const r = await fetch(
      bust(`${API_BASE}/api/engagement/quiz/${gamePk}/${quizId}/vote`),
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name, optionIndex }),
        signal,
      }
    );
    const data = await asJson<{
      success: boolean;
      correct: boolean;
      correctIndex: number | null;
      myScore: number;
    }>(r);
    return { correct: data.correct, correctIndex: data.correctIndex, myScore: data.myScore };
  } finally {
    cancel();
  }
}

/** Top N users by score (use every ~2 minutes) */
export async function fetchLeaderboard(gamePk: number, limit = 5): Promise<LeaderRow[]> {
  const { signal, cancel } = withTimeout();
  try {
    const r = await fetch(
      bust(`${API_BASE}/api/engagement/quiz/${gamePk}/leaderboard?limit=${limit}`),
      { headers: { Accept: "application/json" }, signal }
    );
    const data = await asJson<{ success: boolean; top: LeaderRow[] }>(r);
    return data.top ?? [];
  } finally {
    cancel();
  }
}
