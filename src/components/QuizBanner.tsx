import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { fetchLatestQuiz, voteQuiz, type Quiz } from "../api/quiz";

type Props = { gamePk: number; name: string };

export default function QuizBanner({ gamePk, name }: Props) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Keep last quizId to avoid re-mount flicker
  const lastIdRef = useRef<string | null>(null);

  const now = Date.now();
  const expiresAtMs = useMemo(
    () => (quiz?.expiresAt ? new Date(quiz.expiresAt).getTime() : null),
    [quiz?.expiresAt]
  );
  const revealAtMs = useMemo(
    () => (quiz?.revealAt ? new Date(quiz.revealAt).getTime() : null),
    [quiz?.revealAt]
  );

  const expired = expiresAtMs != null && now >= expiresAtMs;
  const canVote = !expired && selected === null && !revealed;

  const pull = useCallback(async () => {
    try {
      const q = await fetchLatestQuiz(gamePk);
      if (!q) return;

      // Only update UI when there’s a new quizId
      if (lastIdRef.current !== q.quizId) {
        lastIdRef.current = q.quizId;
        setQuiz(q);
        setSelected(null);
        setCorrectIndex(null);
        setRevealed(false);
        setErr(null);
      } else {
        // keep quiz but refresh times (reveal/expires) if server updated them
        setQuiz((prev) => (prev ? { ...prev, ...q } : q));
      }
    } catch (e: any) {
      // don’t spam errors in UI; just keep silent or log
      setErr(e?.message ?? "Quiz fetch failed");
    }
  }, [gamePk]);

  // Initial + poll every 10s
  useEffect(() => {
    pull();
    const t = setInterval(pull, 10_000);
    return () => clearInterval(t);
  }, [pull]);

  // Local reveal timer: if server gives revealAt, flip revealed at that time
  useEffect(() => {
    if (!revealAtMs) return;
    if (Date.now() >= revealAtMs) {
      setRevealed(true);
      return;
    }
    const id = setTimeout(() => setRevealed(true), revealAtMs - Date.now());
    return () => clearTimeout(id);
  }, [revealAtMs]);

  // If server never provides revealAt, we reveal 5s after voting
  const scheduleLocalReveal = useCallback(() => {
    if (revealAtMs) return; // server-driven already
    setTimeout(() => setRevealed(true), 5000);
  }, [revealAtMs]);

  const onPick = async (idx: number) => {
    if (!quiz || !canVote) return;
    setSelected(idx);
    try {
      const res = await voteQuiz(gamePk, quiz.quizId, name || "You", idx);
      setCorrectIndex(res.correctIndex);
      // If server didn’t include revealAt, locally reveal after 5s
      scheduleLocalReveal();
    } catch (e: any) {
      setErr(e?.message ?? "Vote failed");
      setSelected(null); // allow retry on transient error
    }
  };

  // Hide if no quiz or already expired
  if (!quiz || expired) return null;

  const showReveal = revealed && correctIndex != null;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Pop Quiz</Text>
      <Text style={styles.qtext}>{quiz.question}</Text>

      <View style={{ height: 8 }} />
      {quiz.options.map((opt, i) => {
        const isPicked = selected === i;
        const isCorrect = showReveal && correctIndex === i;
        const isWrongPick = showReveal && isPicked && correctIndex !== i;
        const disabled = !canVote;

        return (
          <Pressable
            key={`${quiz.quizId}-${i}`}
            onPress={disabled ? undefined : () => onPick(i)}
            accessibilityRole="button"
            accessibilityState={{ disabled }}
            style={[
              styles.option,
              isPicked && styles.optionPicked,
              isCorrect && styles.optCorrect,
              isWrongPick && styles.optWrong,
              disabled && styles.optionDisabled,
            ]}
          >
            <Text style={styles.optText}>
              {String.fromCharCode(65 + i)}. {opt}
            </Text>
          </Pressable>
        );
      })}

      <View style={{ height: 6 }} />
      {selected === null && !revealed ? (
        <Text style={styles.hint}>Tap an option to vote.</Text>
      ) : !revealed ? (
        <Text style={styles.hint}>
          Answer locked{revealAtMs ? "" : " • revealing in ~5s"}…
        </Text>
      ) : (
        <Text style={styles.hint}>
          {correctIndex != null && selected != null
            ? selected === correctIndex
              ? "✅ Correct!"
              : `❌ Incorrect. Correct answer is ${String.fromCharCode(65 + correctIndex)}`
            : "Results revealed."}
        </Text>
      )}

      {err ? <Text style={styles.err}>{err}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 12,
    marginBottom: 4,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  label: {
    color: "#A7F3D0",
    fontWeight: "900",
    marginBottom: 4,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  qtext: { color: "#fff", fontWeight: "800", fontSize: 15 },
  option: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  optionPicked: {
    borderColor: "#93C5FD",
    backgroundColor: "rgba(147,197,253,0.12)",
  },
  optionDisabled: { opacity: 0.85 },
  optCorrect: {
    borderColor: "#34D399",
    backgroundColor: "rgba(52,211,153,0.18)",
  },
  optWrong: {
    borderColor: "#F87171",
    backgroundColor: "rgba(248,113,113,0.18)",
  },
  optText: { color: "#fff", fontWeight: "700" },
  hint: { color: "rgba(255,255,255,0.7)", marginTop: 10, fontSize: 12 },
  err: { color: "salmon", marginTop: 6, fontSize: 12 },
});
