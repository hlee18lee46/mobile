// src/components/QuizBanner.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import theme from "../theme";

type Choice = { label: string };
type QuizQ = {
  _id: string;
  gamePk: number;
  text: string;
  choices: Choice[];
  correctIndex?: number | null;
  revealAt: string;
  closesAt: string;
  createdAt: string;
};

type Props = { gamePk: number; name: string };

const API = "https://livesports-beta.vercel.app"; // swap to your local base if needed

export default function QuizBanner({ gamePk, name }: Props) {
  const [q, setQ] = useState<QuizQ | null>(null);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const revealTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLatest = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/quiz/${gamePk}/latest`, { headers: { Accept: "application/json" } });
      if (!r.ok) return;
      const data = await r.json();
      const next: QuizQ | null = data?.question ?? null;
      if (next && next._id !== q?._id) {
        setQ(next);
        setPicked(null);
        setRevealed(false);
      }
    } catch {}
  }, [gamePk, q?._id]);

  useEffect(() => {
    fetchLatest();
    pollRef.current && clearInterval(pollRef.current);
    pollRef.current = setInterval(fetchLatest, 5000);
    return () => { pollRef.current && clearInterval(pollRef.current); };
  }, [fetchLatest]);

  useEffect(() => {
    if (!q?.revealAt) return;
    const target = new Date(q.revealAt).getTime();
    const tick = () => { if (Date.now() >= target) setRevealed(true); };
    tick();
    revealTimer.current && clearInterval(revealTimer.current);
    revealTimer.current = setInterval(tick, 500);
    return () => { revealTimer.current && clearInterval(revealTimer.current); };
  }, [q?.revealAt]);

  if (!q) return null;

  async function vote(questionId: string, choiceIdx: number) {
    if (picked !== null) return;
    setPicked(choiceIdx);
    setLoading(true);
    try {
      await fetch(`${API}/api/quiz/${gamePk}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name, questionId, choice: choiceIdx }),
      });
    } catch {}
    setLoading(false);
  }

  const closed = Date.now() > new Date(q.closesAt).getTime();

  return (
    <View style={s.wrap}>
      <Text style={s.title}>Pop Quiz</Text>
      <Text style={s.question}>{q.text}</Text>

      <View style={{ marginTop: 10 }}>
        {q.choices.map((c, i) => {
          const isPicked = picked === i;
          const isCorrect = revealed && q.correctIndex === i;
          const disabled = loading || closed || revealed;
          return (
            <Pressable
              key={i}
              onPress={() => vote(q._id, i)}
              disabled={disabled}
              style={[
                s.choice,
                isPicked && s.choicePicked,
                isCorrect && s.choiceCorrect,
                disabled && s.choiceDisabled,
              ]}
            >
              <Text style={s.choiceText}>
                {c.label}{isCorrect ? "  ✓" : isPicked && revealed ? "  ✗" : ""}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={s.meta}>
        {revealed
          ? "Answer revealed!"
          : `Reveals ${new Date(q.revealAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}
        {" • "}Closes {new Date(q.closesAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { margin: 12, padding: 12, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  title: { color: "#fff", fontWeight: "900", marginBottom: 4 },
  question: { color: "#e5e7eb" },
  choice: { marginTop: 8, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  choicePicked: { backgroundColor: "rgba(255,255,255,0.1)" },
  choiceCorrect: { borderColor: "#34d399" },
  choiceDisabled: { opacity: 0.6 },
  choiceText: { color: "#fff", fontWeight: "700" },
  meta: { color: theme.colors.subtext, marginTop: 8, fontSize: 12 },
});
