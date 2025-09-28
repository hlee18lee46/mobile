import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import theme from "../theme";

type Poll = {
  _id?: string;
  question: string;
  choices: string[];
  answerIndex?: number; // hidden to users
  tallies?: number[];
};

export default function PollCard({ poll, onVote }: { poll: Poll; onVote: (choiceIndex: number) => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const total = useMemo(() => (poll.tallies ?? []).reduce((a, b) => a + b, 0), [poll.tallies]);

  return (
    <View style={s.card}>
      <Text style={s.q}>{poll.question}</Text>
      <View style={{ height: 8 }} />
      {poll.choices.map((c, idx) => {
        const pct = total ? Math.round(((poll.tallies?.[idx] ?? 0) * 100) / total) : 0;
        const chosen = picked === idx;
        return (
          <Pressable
            key={idx}
            onPress={() => { setPicked(idx); onVote(idx); }}
            style={[s.choice, chosen && s.choiceActive]}
          >
            <Text style={[s.choiceTxt, chosen && s.choiceTxtActive]}>{c}</Text>
            {total > 0 && <Text style={s.pct}>{pct}%</Text>}
          </Pressable>
        );
      })}
      {total > 0 && <Text style={s.total}>{total} votes</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  card: { margin: 12, padding: 12, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  q: { color: "#fff", fontWeight: "900" },
  choice: { marginTop: 8, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  choiceActive: { backgroundColor: "rgba(52,211,153,0.15)", borderColor: "#34d399" },
  choiceTxt: { color: "#fff", fontWeight: "800" },
  choiceTxtActive: { color: "#34d399" },
  pct: { color: theme.colors.subtext, position: "absolute", right: 10, top: 10, fontWeight: "700" },
  total: { marginTop: 8, color: theme.colors.subtext },
});
