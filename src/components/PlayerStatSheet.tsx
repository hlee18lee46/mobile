// src/components/PlayerStatSheet.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Modal, View, Text, ActivityIndicator, Pressable, StyleSheet, ScrollView } from "react-native";
import theme from "../theme";
import { fetchPlayerSeasonStats, slashLine } from "../api/stats";

type Props = {
  visible: boolean;
  player: { id: number; name: string; role: "batter" | "pitcher" } | null;
  onClose: () => void;
};

// adjust the min/max seasons you want to support
const CURRENT_SEASON = new Date().getFullYear();
const MIN_SEASON = 2015;

export default function PlayerStatSheet({ visible, player, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [stat, setStat] = useState<Record<string, any> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [season, setSeason] = useState(CURRENT_SEASON);

  // reset season when player changes
  useEffect(() => {
    setSeason(CURRENT_SEASON);
  }, [player?.id]);

  const group = useMemo(
    () => (player?.role === "pitcher" ? "pitching" : "hitting"),
    [player?.role]
  );

  useEffect(() => {
    let mounted = true;
    async function run() {
      if (!player) return;
      setLoading(true);
      setErr(null);
      try {
        // NOTE: fetchPlayerSeasonStats signature expects (playerId, season, group?)
        // If your helper only takes (playerId, season), remove the third arg.
        const s = await fetchPlayerSeasonStats(player.id, season, group as any);
        if (mounted) setStat(s);
      } catch (e: any) {
        if (mounted) setErr(e?.message ?? "Failed to load stats");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, [player?.id, group, season]);

  const decYear = () => setSeason((y) => Math.max(MIN_SEASON, y - 1));
  const incYear = () => setSeason((y) => Math.min(CURRENT_SEASON, y + 1));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {player?.name ?? "Player"} • {group === "pitching" ? "Pitching" : "Hitting"}
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>

          {/* Year selector */}
          <View style={styles.yearRow}>
            <Pressable onPress={decYear} disabled={season <= MIN_SEASON} style={[styles.yearBtn, season <= MIN_SEASON && styles.yearBtnDisabled]}>
              <Text style={styles.yearBtnTxt}>−</Text>
            </Pressable>
            <Text style={styles.yearLabel}>{season}</Text>
            <Pressable onPress={incYear} disabled={season >= CURRENT_SEASON} style={[styles.yearBtn, season >= CURRENT_SEASON && styles.yearBtnDisabled]}>
              <Text style={styles.yearBtnTxt}>＋</Text>
            </Pressable>
          </View>

          {/* Body */}
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator />
              <Text style={styles.dim}>Loading…</Text>
            </View>
          ) : err ? (
            <View style={styles.center}>
              <Text style={{ color: "salmon", textAlign: "center" }}>{err}</Text>
            </View>
          ) : !stat ? (
            <View style={styles.center}>
              <Text style={styles.dim}>No stats found.</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
              {group === "pitching" ? (
                <View>
                  <Row k="ERA" v={stat.era} />
                  <Row k="WHIP" v={stat.whip} />
                  <Row k="W-L" v={fmtWL(stat.wins, stat.losses)} />
                  <Row k="IP" v={stat.inningsPitched} />
                  <Row k="K" v={stat.strikeOuts} />
                  <Row k="BB" v={stat.baseOnBalls} />
                  <Row k="HR Allowed" v={stat.homeRuns} />
                  <Row k="Opp AVG" v={stat.avg} />
                </View>
              ) : (
                <View>
                  <Row k="Slash" v={slashLine(stat) ?? "-/-/-"} />
                  <Row k="HR" v={stat.homeRuns} />
                  <Row k="RBI" v={stat.rbi} />
                  <Row k="SB" v={stat.stolenBases} />
                  <Row k="AVG" v={stat.avg} />
                  <Row k="OBP" v={stat.obp} />
                  <Row k="SLG" v={stat.slg} />
                  <Row k="OPS" v={stat.ops} />
                  <Row k="PA" v={stat.plateAppearances} />
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function Row({ k, v }: { k: string; v: any }) {
  return (
    <View style={styles.row}>
      <Text style={styles.key}>{k}</Text>
      <Text style={styles.val}>{v ?? "—"}</Text>
    </View>
  );
}
function fmtWL(w?: any, l?: any) {
  if (w == null && l == null) return "—";
  return `${w ?? 0}-${l ?? 0}`;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#0B1220", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: "80%" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  title: { color: "#fff", fontWeight: "900", fontSize: 16 },
  closeBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.1)" },
  closeText: { color: "#fff", fontWeight: "700" },

  yearRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 8 },
  yearBtn: { width: 36, height: 36, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.1)" },
  yearBtnDisabled: { opacity: 0.4 },
  yearBtnTxt: { color: "#fff", fontWeight: "900", fontSize: 18, lineHeight: 20 },
  yearLabel: { color: "#fff", fontWeight: "900", fontSize: 16, minWidth: 64, textAlign: "center" },

  center: { alignItems: "center", justifyContent: "center", paddingVertical: 24 },
  dim: { color: "rgba(255,255,255,0.7)", marginTop: 8 },

  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.1)" },
  key: { color: "#9ca3af", fontWeight: "700" },
  val: { color: "#fff", fontWeight: "800" },
});
