import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, FlatList } from "react-native";
import theme from "../theme";
import GameRow from "../components/GameRow";
import { fetchTodayGames, fetchSchedule, Game } from "../api/mlb";
import MLBStats from "./MLBStats"; // 👈 add this

type TabKey = "TODAY" | "SCHEDULE" | "STATS";
type IntervalId = ReturnType<typeof setInterval>;

export default function MLB() {
  const [tab, setTab] = useState<TabKey>("TODAY");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const pollRef = useRef<IntervalId | null>(null);

// 🔒 Hard-coded date override for "Today"
const HARD_CODED_DATE = "2025-09-27"; // <= change this when needed


  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const data =
        tab === "TODAY" ? await fetchTodayGames(HARD_CODED_DATE)
        : tab === "SCHEDULE" ? await fetchSchedule(7)
        : [];
      setGames(data);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();

    // Poll only Today's games every 5s
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

  // FlatList helpers
  const keyExtractor = useCallback(
    (g: any, idx: number) => String(g.id ?? g.gamePk ?? g._id ?? idx),
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: Game }) => <GameRow game={item} />,
    []
  );

  const gamesEmpty = useMemo(
    () => !loading && !err && games.length === 0,
    [loading, err, games.length]
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable style={[styles.pill, tab === "TODAY" && styles.pillActive]} onPress={() => setTab("TODAY")}>
          <Text style={[styles.pillText, tab === "TODAY" && styles.pillTextActive]}>Today</Text>
        </Pressable>
        <Pressable style={[styles.pill, tab === "SCHEDULE" && styles.pillActive]} onPress={() => setTab("SCHEDULE")}>
          <Text style={[styles.pillText, tab === "SCHEDULE" && styles.pillTextActive]}>Schedule</Text>
        </Pressable>
        <Pressable style={[styles.pill, tab === "STATS" && styles.pillActive]} onPress={() => setTab("STATS")}>
          <Text style={[styles.pillText, tab === "STATS" && styles.pillTextActive]}>Stats</Text>
        </Pressable>
      </View>

      {/* Content */}
      {tab === "STATS" ? (
        <MLBStats />
      ) : err ? (
        <View style={styles.center}><Text style={{ color: "salmon" }}>{err}</Text></View>
      ) : loading && games.length === 0 ? (
        <View style={styles.center}><ActivityIndicator /></View>
      ) : gamesEmpty ? (
        <View style={styles.center}><Text style={{ color: theme.colors.subtext }}>No games found.</Text></View>
      ) : (
        <FlatList
          data={games}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshing={loading}
          onRefresh={load}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", padding: 12 },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    backgroundColor: "transparent",
    marginRight: 8,
  },
  pillActive: { backgroundColor: "rgba(255,255,255,0.12)" },
  pillText: { color: theme.colors.subtext, fontWeight: "700" },
  pillTextActive: { color: theme.colors.text },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 32 },
});
