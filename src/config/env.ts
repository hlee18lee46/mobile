export const API_BASE = "https://livesports-beta.vercel.app";
export const MLB_ENDPOINTS = {
  today: (iso: string) => `/api/games?date=${iso}`,
  schedule: (from: string, to: string) => `/api/games?from=${from}&to=${to}`,
  health: () => `/api/health`,
};
