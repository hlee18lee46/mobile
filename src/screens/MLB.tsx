// src/screens/MLB.tsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import theme from "../theme";
import GameRow from "../components/GameRow";
import { fetchTodayGames, fetchSchedule, Game } from "../api/mlb";

type TabKey = "TODAY" | "SCHEDULE";
// Portable interval type (works in RN without @types/node)
type IntervalId = ReturnType<typeof setInterval>;

export default function MLB() {
  const [tab, setTab] = useState<TabKey>("TODAY");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const pollRef = useRef<IntervalId | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const data =
        tab === "TODAY" ? await fetchTodayGames() : await fetchSchedule(7);
      setGames(data);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();

    // Poll today’s games every 5s; schedule doesn’t need polling
    if (tab === "TODAY") {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(load, 5000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [tab, load]);

  return (
    <View style={{ flex: 1 }}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.pill, tab === "TODAY" && styles.pillActive]}
          onPress={() => setTab("TODAY")}
        >
          <Text
            style={[styles.pillText, tab === "TODAY" && styles.pillTextActive]}
          >
            Today
          </Text>
        </Pressable>
        <Pressable
          style={[styles.pill, styles.pillRight, tab === "SCHEDULE" && styles.pillActive]}
          onPress={() => setTab("SCHEDULE")}
        >
          <Text
            style={[
              styles.pillText,
              tab === "SCHEDULE" && styles.pillTextActive,
            ]}
          >
            Schedule
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      {loading && games.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : err ? (
        <View style={styles.center}>
          <Text style={{ color: "salmon" }}>{err}</Text>
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl tintColor="#fff" refreshing={loading} onRefresh={load} />
          }
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {games.length === 0 ? (
            <View style={styles.center}>
              <Text style={{ color: theme.colors.subtext }}>
                No games found.
              </Text>
            </View>
          ) : (
            games.map((g, idx) => (
              <GameRow key={(g.id ?? g._id ?? idx).toString()} game={g} />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    padding: 12,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    backgroundColor: "transparent",
  },
  // simple spacing without using 'gap' (works across RN versions)
  pillRight: {
    marginLeft: 8,
  },
  pillActive: { backgroundColor: "rgba(255,255,255,0.12)" },
  pillText: { color: theme.colors.subtext, fontWeight: "700" },
  pillTextActive: { color: theme.colors.text },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 32,
  },
});
