import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, FlatList, Modal, TouchableOpacity, ScrollView } from "react-native";
import theme from "../theme";
import { fetchTeams, fetchTeamPlayers, fetchPlayerSeasonStats, Team, Player } from "../api/stats";

const CURRENT_SEASON = new Date().getFullYear();

export default function MLBStats() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [stat, setStat] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);

  const [teamModal, setTeamModal] = useState(false);
  const [playerModal, setPlayerModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const t = await fetchTeams();
        // nice order
        t.sort((a, b) => a.name.localeCompare(b.name));
        setTeams(t);
      } catch (e) {}
    })();
  }, []);

  async function onPickTeam(t: Team) {
    setTeam(t);
    setPlayer(null);
    setStat(null);
    setTeamModal(false);
    setLoading(true);
    try {
      const ps = await fetchTeamPlayers(t.id);
      ps.sort((a, b) => a.fullName.localeCompare(b.fullName));
      setPlayers(ps);
    } catch (e) {
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }

  async function onPickPlayer(p: Player) {
    setPlayer(p);
    setPlayerModal(false);
    setLoading(true);
    try {
      const s = await fetchPlayerSeasonStats(p.id, CURRENT_SEASON);
      setStat(s);
    } catch (e) {
      setStat(null);
    } finally {
      setLoading(false);
    }
  }

  const header = useMemo(
    () => `${team ? `${team.name}` : "Select team"}${player ? ` • ${player.fullName}` : ""}`,
    [team, player]
  );

  return (
    <View style={{ flex: 1 }}>
      <Text style={s.h1}>MLB Stats</Text>

      <View style={s.row}>
        <Pressable style={s.select} onPress={() => setTeamModal(true)}>
          <Text style={s.selectLabel}>Team</Text>
          <Text style={s.selectValue}>{team ? team.name : "Select team"}</Text>
        </Pressable>

        <Pressable
          style={[s.select, !team && { opacity: 0.5 }]}
          onPress={() => team && setPlayerModal(true)}
          disabled={!team}
        >
          <Text style={s.selectLabel}>Player</Text>
          <Text style={s.selectValue}>{player ? player.fullName : "Select player"}</Text>
        </Pressable>
      </View>

      {loading && !stat ? (
        <View style={s.center}><ActivityIndicator /></View>
      ) : player && stat ? (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={s.title}>{header}</Text>
          <View style={s.card}>
            {[
              ["Games", stat.gamesPlayed],
              ["AVG", stat.avg],
              ["OBP", stat.obp],
              ["SLG", stat.slg],
              ["OPS", stat.ops],
              ["HR", stat.homeRuns],
              ["RBI", stat.rbi],
              ["SB", stat.stolenBases],
              ["BB", stat.baseOnBalls],
              ["SO", stat.strikeOuts],
              ["H", stat.hits],
              ["2B", stat.doubles],
              ["3B", stat.triples],
              ["TB", stat.totalBases],
              ["PA", stat.plateAppearances],
              ["AB", stat.atBats],
            ].map(([k, v]) => (
              <View key={k as string} style={s.statRow}>
                <Text style={s.k}>{k}</Text>
                <Text style={s.v}>{v ?? "—"}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={s.center}>
          <Text style={{ color: theme.colors.subtext }}>Pick a team, then a player.</Text>
        </View>
      )}

      {/* Team picker */}
      <Modal visible={teamModal} transparent animationType="fade" onRequestClose={() => setTeamModal(false)}>
        <TouchableOpacity style={s.modalBackdrop} activeOpacity={1} onPress={() => setTeamModal(false)}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Select team</Text>
            <FlatList
              data={teams}
              keyExtractor={(t) => String(t.id)}
              renderItem={({ item }) => (
                <Pressable style={s.item} onPress={() => onPickTeam(item)}>
                  <Text style={s.itemText}>{item.name}</Text>
                </Pressable>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Player picker */}
      <Modal visible={playerModal} transparent animationType="fade" onRequestClose={() => setPlayerModal(false)}>
        <TouchableOpacity style={s.modalBackdrop} activeOpacity={1} onPress={() => setPlayerModal(false)}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Select player</Text>
            <FlatList
              data={players}
              keyExtractor={(p) => String(p.id)}
              renderItem={({ item }) => (
                <Pressable style={s.item} onPress={() => onPickPlayer(item)}>
                  <Text style={s.itemText}>
                    {item.fullName}{item.position ? ` • ${item.position}` : ""}{item.primaryNumber ? ` #${item.primaryNumber}` : ""}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  h1: { color: "#fff", fontSize: 24, fontWeight: "900", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  row: { flexDirection: "row", paddingHorizontal: 16, gap: 10 },
  select: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 14, padding: 12,
  },
  selectLabel: { color: theme.colors.subtext, fontSize: 12, marginBottom: 6 },
  selectValue: { color: theme.colors.text, fontWeight: "800" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { color: theme.colors.text, fontSize: 18, fontWeight: "800", marginBottom: 12 },
  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 16, padding: 12,
  },
  statRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  k: { color: theme.colors.subtext },
  v: { color: theme.colors.text, fontWeight: "800" },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 16 },
  modalCard: { backgroundColor: "#0B1220", borderRadius: 16, padding: 12, maxHeight: "70%" },
  modalTitle: { color: "#fff", fontWeight: "900", fontSize: 18, padding: 8, paddingBottom: 4 },
  item: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
  itemText: { color: "#fff" },
});
