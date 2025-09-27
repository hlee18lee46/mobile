import React from "react";
import { View, Text, StyleSheet } from "react-native";
import theme from "../theme";
import type { Game } from "../api/mlb";

export default function GameRow({ game }: { game: Game }) {
  const score =
    game.home?.score != null && game.away?.score != null
      ? `${game.away.score} - ${game.home.score}`
      : "—";

  const startLocal = game.startTime
    ? new Date(game.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : "";

  const statusLabel =
    game.status === "in_progress" ? "Live" :
    game.status === "final" ? "Final" :
    "Scheduled";

  return (
    <View style={styles.row}>
      <Text style={styles.teams}>
        {game.away?.name ?? "TBD"} @ {game.home?.name ?? "TBD"}
      </Text>
      <Text style={styles.meta}>
        {statusLabel}{startLocal ? ` • ${startLocal}` : ""}
      </Text>
      <Text style={styles.score}>{score}</Text>
      {game.venue ? <Text style={styles.venue}>{game.venue}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  teams: { color: theme.colors.text, fontWeight: "800" },
  meta: { color: theme.colors.subtext, marginTop: 2, fontSize: 12 },
  score: { color: "#cbd5e1", marginTop: 6, fontWeight: "700" },
  venue: { color: theme.colors.subtext, marginTop: 2, fontSize: 12 },
});
