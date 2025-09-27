import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import theme from "../theme";
import BasesDiamond from "../components/BasesDiamond";
import CountBox from "../components/CountBox";
import ChatRoom from "../components/ChatRoom";
import { fetchLive, type LiveGame } from "../api/live";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

type Props = NativeStackScreenProps<RootStackParamList, "GameDetail">;

export default function GameDetail({ route }: Props) {
  const { gamePk, home, away } = route.params;
  const [live, setLive] = useState<LiveGame | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const EXTRA_TOP = 0; // tweak this to taste (e.g., 24–40)

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
        <Pressable onPress={load} style={s.retry}><Text style={s.retryText}>Retry</Text></Pressable>
      </View>
    );
  }

  return (

    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      {/* Live panel (non-scrolling) */}
          <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={["top", "left", "right"]}>
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
        <Text style={s.bp}>🧢 Batter: {live?.batter?.name ?? "—"}</Text>
        <Text style={s.bp}>⚾ Pitcher: {live?.pitcher?.name ?? "—"}</Text>
      </View>
    </SafeAreaView>

      {/* Chat takes the rest and scrolls */}
      <View style={{ flex: 1 }}>
        <ChatRoom gamePk={gamePk} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  center:{ flex:1, alignItems:"center", justifyContent:"center" },
  panel: {
    paddingTop: 20,         // ↑ more air at the top
    paddingHorizontal: 16,  // left/right padding
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },  title:{ color:"#fff", fontSize:20, fontWeight:"900" },
  meta:{ color: theme.colors.subtext, marginTop:6 },
  scoreRow:{ flexDirection:"row", justifyContent:"space-between", marginTop:10, marginBottom:6 },
  score:{ color:"#fff", fontWeight:"800", fontSize:18 },
  bp:{ color:"#fff", marginTop:6 },
  retry:{ marginTop:12, paddingHorizontal:12, paddingVertical:8, borderRadius:10, backgroundColor:"#34d399" },
  retryText:{ color:"#0B1220", fontWeight:"900" },
});
