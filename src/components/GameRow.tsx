// src/components/GameRow.tsx
import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import theme from "../theme";
import type { Game } from "../api/mlb";

function statusState(raw?: string) {
  const s = (raw || "").toLowerCase();
  if (/(in[_\s-]?progress|live|in game|playing)/.test(s)) return "playing";
  if (/(final|completed|ended)/.test(s)) return "final";
  return "scheduled";
}

export default function GameRow({ game }: { game: Game }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const state = statusState(game.status);
  const isPlaying = state === "playing";
  const isFinal = state === "final";

  const score =
    game.home?.score != null && game.away?.score != null
      ? `${game.away.score} - ${game.home.score}`
      : "—";

  const startLocal = game.startTime
    ? new Date(game.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : "";

  const inningDesc =
    (game as any)?.inning_desc ||
    (game as any)?.inning ||
    "";

  const gamePk = Number((game as any).gamePk ?? game.id);

  const onPress = () => {
    if (!gamePk || Number.isNaN(gamePk)) {
      console.warn("Missing gamePk/id on game row:", game);
      return;
    }
    navigation.navigate("GameDetail", {
      gamePk,
      home: game.home?.name ?? "Home",
      away: game.away?.name ?? "Away",
    });
  };

  return (
    <Pressable onPress={onPress} android_ripple={{ color: "rgba(255,255,255,0.08)" }}>
      <View style={styles.row}>
        <View style={styles.header}>
          <Text style={styles.teams}>
            {game.away?.name ?? "TBD"} @ {game.home?.name ?? "TBD"}
          </Text>

          <View
            style={[
              styles.badge,
              isPlaying ? styles.badgePlaying : isFinal ? styles.badgeFinal : styles.badgeScheduled,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                isPlaying ? styles.badgeTextDark : styles.badgeTextLight,
              ]}
            >
              {isPlaying ? "Playing" : isFinal ? "Final" : "Scheduled"}
            </Text>
          </View>
        </View>

        <Text style={styles.meta}>
          {isPlaying
            ? (inningDesc ? String(inningDesc) : "Live")
            : isFinal
            ? "Game ended"
            : startLocal ? `First pitch • ${startLocal}` : "TBD"}
        </Text>

        <Text style={styles.score}>{score}</Text>
        {game.venue ? <Text style={styles.venue}>{game.venue}</Text> : null}
      </View>
    </Pressable>
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  teams: { color: theme.colors.text, fontWeight: "800", paddingRight: 8, flexShrink: 1 },
  meta: { color: theme.colors.subtext, marginTop: 6, fontSize: 12 },
  score: { color: "#cbd5e1", marginTop: 6, fontWeight: "700" },
  venue: { color: theme.colors.subtext, marginTop: 2, fontSize: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  badgeText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.3 },
  badgeTextLight: { color: "#fff" },
  badgeTextDark: { color: "#0B1220" },
  badgePlaying: { backgroundColor: "#34d399", borderColor: "#34d399" },
  badgeFinal: { backgroundColor: "transparent", borderColor: "rgba(255,255,255,0.25)" },
  badgeScheduled: { backgroundColor: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.25)" },
});
