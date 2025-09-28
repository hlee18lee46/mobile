// src/screens/GameDetail.tsx
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { RootStackParamList } from "../../App";
import theme from "../theme";
import BasesDiamond from "../components/BasesDiamond";
import CountBox from "../components/CountBox";
import ChatRoom from "../components/ChatRoom";
import QuizBanner from "../components/QuizBanner";
import PlayerStatSheet from "../components/PlayerStatSheet";
import { fetchLive, type LiveGame } from "../api/live";

type Props = NativeStackScreenProps<RootStackParamList, "GameDetail">;

export default function GameDetail({ route }: Props) {
  const { gamePk, home, away } = route.params;
  const [live, setLive] = useState<LiveGame | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // who we’re showing stats for
  const [statTarget, setStatTarget] =
    useState<{ id: number; name: string; role: "batter" | "pitcher" } | null>(null);

  const insets = useSafeAreaInsets();
  const EXTRA_TOP = 8; // add a bit more breathing room

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const g = await fetchLive(gamePk);
      setLive(g);
      setErr(null);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [gamePk]);

  useEffect(() => {
    load();
    const t = setInterval(load, 2000); // poll live every 2s
    return () => clearInterval(t);
  }, [load]);

  if (!live && !err) {
    return (
      <View style={s.center}>
        <ActivityIndicator />
        <Text style={s.meta}>Loading…</Text>
      </View>
    );
  }
  if (err) {
    return (
      <View style={s.center}>
        <Text style={{ color: "salmon" }}>{err}</Text>
        <Pressable onPress={load} style={s.retry}>
          <Text style={s.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const batterPress = live?.batter?.id
    ? () => setStatTarget({ id: live!.batter!.id, name: live!.batter!.name ?? "Batter", role: "batter" })
    : undefined;

  const pitcherPress = live?.pitcher?.id
    ? () => setStatTarget({ id: live!.pitcher!.id, name: live!.pitcher!.name ?? "Pitcher", role: "pitcher" })
    : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <SafeAreaView style={{ backgroundColor: theme.colors.bg }} edges={["top", "left", "right"]}>
        {/* Top spacer = safe area + extra */}
        <View style={{ height: insets.top + EXTRA_TOP }} />
        <View style={[s.panel, { paddingTop: Math.max(16, insets.top * 0.5) }]}>
          <Text style={s.title}>{away} @ {home}</Text>
          <Text style={s.meta}>
            {live?.status ?? ""}{live?.inning_desc ? ` • ${live?.inning_desc}` : ""}
            {loading ? " • Updating…" : ""}
          </Text>

          <View style={s.scoreRow}>
            <Text style={s.score}>{away}: {live?.away_RHE?.R ?? "-"}</Text>
            <Text style={s.score}>{home}: {live?.home_RHE?.R ?? "-"}</Text>
          </View>

          <BasesDiamond bases={live?.bases ?? { "1B": false, "2B": false, "3B": false }} />
          <View style={{ height: 12 }} />
          <CountBox balls={live?.balls ?? 0} strikes={live?.strikes ?? 0} outs={live?.outs ?? 0} />

          <View style={{ height: 16 }} />
          <Pressable disabled={!batterPress} onPress={batterPress} style={s.tapRow} accessibilityRole="button">
            <Text style={s.bp}>🧢 Batter: </Text>
            <Text style={[s.bp, batterPress && s.link]}>{live?.batter?.name ?? "—"}</Text>
          </Pressable>

          <Pressable disabled={!pitcherPress} onPress={pitcherPress} style={s.tapRow} accessibilityRole="button">
            <Text style={s.bp}>⚾ Pitcher: </Text>
            <Text style={[s.bp, pitcherPress && s.link]}>{live?.pitcher?.name ?? "—"}</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Chat */}
      <View style={{ flex: 1 }}>
          <QuizBanner gamePk={gamePk} name={"User"} />

        <ChatRoom gamePk={gamePk} />
      </View>

      {/* Stats bottom sheet */}
      <PlayerStatSheet
        visible={!!statTarget}
        player={statTarget ? { id: statTarget.id, name: statTarget.name, role: statTarget.role } : null}
        onClose={() => setStatTarget(null)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  panel: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  title: { color: "#fff", fontSize: 20, fontWeight: "900" },
  meta: { color: theme.colors.subtext, marginTop: 6 },
  scoreRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10, marginBottom: 6 },
  score: { color: "#fff", fontWeight: "800", fontSize: 18 },
  bp: { color: "#fff", marginTop: 6 },
  link: { textDecorationLine: "underline" },
  tapRow: { flexDirection: "row", alignItems: "center" },
  retry: { marginTop: 12, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: "#34d399" },
  retryText: { color: "#0B1220", fontWeight: "900" },
});
