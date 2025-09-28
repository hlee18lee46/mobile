// src/components/ChatRoom.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { fetchChat, sendChat, ChatMsg } from "../api/chat";
import {
  fetchLatestQuiz,
  voteQuiz,
  fetchLeaderboard,
  type Quiz,
} from "../api/quiz";

type Props = { gamePk: number; defaultName?: string };

export default function ChatRoom({ gamePk, defaultName = "You" }: Props) {
  const [name, setName] = useState(defaultName);
  const [text, setText] = useState("");
  const [items, setItems] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const lastTs = useRef<string | undefined>(undefined);
  const listRef = useRef<FlatList<ChatMsg>>(null);

  // Quiz state
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealAt, setRevealAt] = useState<number | null>(null);
  const [revealed, setRevealed] = useState<boolean>(false);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);
  const [myScore, setMyScore] = useState<number>(0);

  const scrollToBottom = () =>
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);

  const load = useCallback(async () => {
    try {
      const chunk = await fetchChat(gamePk, lastTs.current);
      if (chunk.length) {
        lastTs.current = chunk[chunk.length - 1].ts;
        setItems((prev) => [...prev, ...chunk]);
        scrollToBottom();
      }
      setLoading(false);
    } catch (e: any) {
      setErr(e?.message ?? "Chat load failed");
      setLoading(false);
    }
  }, [gamePk]);

  useEffect(() => {
    load();
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, [load]);

  const pullQuiz = useCallback(async () => {
    try {
      const q = await fetchLatestQuiz(gamePk);
      if (!q) return;
      if (quiz?.quizId !== q.quizId) {
        setQuiz(q);
        setSelected(null);
        setRevealed(false);
        setCorrectIndex(null);
        setRevealAt(null);
      }
    } catch {}
  }, [gamePk, quiz?.quizId]);

  useEffect(() => {
    pullQuiz();
    const t = setInterval(pullQuiz, 30_000);
    return () => clearInterval(t);
  }, [pullQuiz]);

  useEffect(() => {
    if (!revealAt) return;
    const tick = setInterval(() => {
      if (Date.now() >= revealAt && !revealed) setRevealed(true);
    }, 200);
    return () => clearInterval(tick);
  }, [revealAt, revealed]);

  const postLeaderboard = useCallback(async () => {
    try {
      const top = await fetchLeaderboard(gamePk, 5);
      if (!top.length) return;
      const lines = top.map((r, i) => `${i + 1}. ${r.name} — ${r.score}`).join("\n");
      const sys: ChatMsg = {
        gamePk,
        name: "🏆 QuizBot",
        text: `Leaderboard update:\n${lines}`,
        ts: new Date().toISOString(),
      };
      setItems((prev) => [...prev, sys]);
      scrollToBottom();
    } catch {}
  }, [gamePk]);

  useEffect(() => {
    const t = setInterval(postLeaderboard, 120_000);
    return () => clearInterval(t);
  }, [postLeaderboard]);

  const onVote = async (idx: number) => {
    if (!quiz || selected !== null) return;
    setSelected(idx);
    try {
      const res = await voteQuiz(gamePk, quiz.quizId, name || "You", idx);
      setCorrectIndex(res.correctIndex);
      setMyScore(res.myScore);
      setRevealAt(Date.now() + 5000);
    } catch (e: any) {
      setErr(e?.message ?? "Vote failed");
      setSelected(null);
    }
  };

  async function onSend() {
    const t = text.trim();
    if (!t) return;
    setText("");
    const optimistic: ChatMsg = {
      gamePk,
      name: name || "You",
      text: t,
      ts: new Date().toISOString(),
    };
    setItems((prev) => [...prev, optimistic]);
    scrollToBottom();
    try {
      await sendChat(gamePk, optimistic.name, t);
    } catch (e: any) {
      setErr(e?.message ?? "Send failed");
    }
  }

  const renderQuiz = () => {
    if (!quiz) return null;
    const expired = quiz.expiresAt && Date.now() > new Date(quiz.expiresAt).getTime();

    return (
      <View style={q.card}>
        <Text style={q.label}>Pop Quiz</Text>
        <Text style={q.qtext}>{quiz.question}</Text>
        <View style={{ height: 8 }} />

        {quiz.options.map((opt, i) => {
          const isPicked = selected === i;
          const showReveal = revealed && correctIndex != null;
          const isDisabled = selected !== null || !!expired;

          const correctStyle = showReveal && correctIndex === i ? q.optCorrect : null;
          const wrongStyle = showReveal && isPicked && correctIndex !== i ? q.optWrong : null;

          return (
            <Pressable
              key={`${quiz.quizId}-${i}`}
              onPress={!isDisabled ? () => onVote(i) : undefined}
              accessibilityState={{ disabled: isDisabled }}
              style={[
                q.option,
                isPicked && q.optionPicked,
                correctStyle,
                wrongStyle,
                isDisabled && q.optionDisabled,
              ]}
            >
              <Text style={q.optText}>
                {String.fromCharCode(65 + i)}. {opt}
              </Text>
            </Pressable>
          );
        })}

        {selected === null && !revealed ? (
          <Text style={q.hint}>Tap an option to vote.</Text>
        ) : !revealed ? (
          <Text style={q.hint}>Answer locked. Revealing in 5s…</Text>
        ) : (
          <Text style={q.hint}>
            {correctIndex != null && selected != null
              ? selected === correctIndex
                ? `✅ Correct! Your score: ${myScore}`
                : `❌ Incorrect. Correct answer is ${String.fromCharCode(65 + correctIndex)}. Your score: ${myScore}`
              : "Results revealed."}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {renderQuiz()}

      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(m, i) => (m._id ?? `${m.ts}-${i}`)}
        renderItem={({ item }) => (
          <View style={s.msg}>
            <Text style={s.name}>{item.name}</Text>
            <Text style={s.text}>{item.text}</Text>
          </View>
        )}
        contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
        onContentSizeChange={scrollToBottom}
      />

      <KeyboardAvoidingView behavior={Platform.select({ ios: "padding", android: undefined })}>
        <View style={s.composer}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="name"
            placeholderTextColor="rgba(234,240,255,0.5)"
            style={[s.input, { flexBasis: 110 }]}
          />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={loading ? "Connecting…" : "say something…"}
            placeholderTextColor="rgba(234,240,255,0.5)"
            style={[s.input, { flex: 1, marginLeft: 8 }]}
          />
          <Pressable
            style={[s.send, !text.trim() && { opacity: 0.6 }]}
            onPress={text.trim() ? onSend : undefined}
            accessibilityState={{ disabled: !text.trim() }}
          >
            <Text style={{ color: "#0B1220", fontWeight: "900" }}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {err ? <Text style={{ color: "salmon", paddingHorizontal: 12, paddingBottom: 8 }}>{err}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  msg: {
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  name: { color: "#fff", fontWeight: "800" },
  text: { color: "#e5e7eb", marginTop: 4 },
  composer: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 0.5,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    paddingHorizontal: 10,
    color: "#fff",
  },
  send: {
    marginLeft: 8,
    backgroundColor: "#34d399",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});

const q = StyleSheet.create({
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
});
