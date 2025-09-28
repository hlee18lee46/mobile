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

type Props = { gamePk: number; defaultName?: string };

// === Engagement config ===
const QUIZ_MS = 30_000; // every 30s
const LEADER_MS = 120_000; // every 2m
const API_BASE = "https://livesports-beta.vercel.app"; // change to http://localhost:3000 for local dev

export default function ChatRoom({ gamePk, defaultName = "You" }: Props) {
  const [name, setName] = useState(defaultName);
  const [text, setText] = useState("");
  const [items, setItems] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const lastTs = useRef<string | undefined>(undefined);
  const listRef = useRef<FlatList<ChatMsg>>(null);

  // ---------- helpers ----------
  const scrollToEnd = () =>
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);

  const pushSystem = (systemText: string) => {
    setItems((prev) => [
      ...prev,
      {
        gamePk,
        name: "Quiz",
        text: systemText,
        ts: new Date().toISOString(),
      } as ChatMsg,
    ]);
    scrollToEnd();
  };

  const fmtQuiz = (q: any) => {
    if (!q) return "";
    const opts = Array.isArray(q.options)
      ? q.options.map((o: string, i: number) => `${i + 1}) ${o}`).join("   ")
      : "";
    const detail = q.detail ? ` ${q.detail}` : "";
    return `${q.question ?? "Pop quiz!"}${detail}\n${opts}`;
  };

  const fmtLeaderboard = (data: any) => {
    const rows = Array.isArray(data?.leaders) ? data.leaders.slice(0, 5) : [];
    if (!rows.length) return "No votes yet. Be the first!";
    return rows.map((r: any, i: number) => `${i + 1}. ${r.name} — ${r.points} pts`).join("\n");
  };

  // ---------- chat polling ----------
  const load = useCallback(async () => {
    try {
      const chunk = await fetchChat(gamePk, lastTs.current);
      if (chunk.length) {
        lastTs.current = chunk[chunk.length - 1].ts;
        setItems((prev) => [...prev, ...chunk]);
        scrollToEnd();
      }
      setLoading(false);
    } catch (e: any) {
      setErr(e?.message ?? "Chat load failed");
      setLoading(false);
    }
  }, [gamePk]);

  useEffect(() => {
    setItems([]); // reset when switching games
    lastTs.current = undefined;
    setLoading(true);
    setErr(null);
    load();
    const t = setInterval(load, 2000); // poll chat every 2s
    return () => clearInterval(t);
  }, [load]);

  // ---------- engagement timers (quiz + leaderboard) ----------
  useEffect(() => {
    let cancelled = false;
    let quizTimer: ReturnType<typeof setInterval> | null = null;
    let leadTimer: ReturnType<typeof setInterval> | null = null;

    const fireQuiz = async () => {
      try {
        const r = await fetch(`${API_BASE}/api/engagement/quiz?gamePk=${gamePk}`);
        const data = await r.json();
        if (cancelled) return;
        if (data?.success && data?.quiz) {
          pushSystem(fmtQuiz(data.quiz));
        }
      } catch {
        /* ignore */
      }
    };

    const fireLeaderboard = async () => {
      try {
        const r = await fetch(`${API_BASE}/api/engagement/leaderboard?gamePk=${gamePk}`);
        const data = await r.json();
        if (cancelled) return;
        if (data?.success) {
          pushSystem(`🏆 Leaderboard (last 2m)\n${fmtLeaderboard(data)}`);
        }
      } catch {
        /* ignore */
      }
    };

    // kick off an immediate quiz so the room feels alive
    fireQuiz();
    quizTimer = setInterval(fireQuiz, QUIZ_MS);
    leadTimer = setInterval(fireLeaderboard, LEADER_MS);

    return () => {
      cancelled = true;
      if (quizTimer) clearInterval(quizTimer);
      if (leadTimer) clearInterval(leadTimer);
    };
  }, [gamePk]);

  // ---------- send ----------
  async function onSend() {
    const t = text.trim();
    if (!t) return;
    setText("");

    // optimistic append
    const optimistic: ChatMsg = {
      gamePk,
      name: name || "You",
      text: t,
      ts: new Date().toISOString(),
    };
    setItems((prev) => [...prev, optimistic]);
    scrollToEnd();

    try {
      await sendChat(gamePk, optimistic.name, t);
    } catch (e: any) {
      setErr(e?.message ?? "Send failed");
    }
  }

  return (
    <View style={{ flex: 1 }}>
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
        onContentSizeChange={scrollToEnd}
      />

      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
      >
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
          <Pressable style={s.send} onPress={onSend} disabled={!text.trim()}>
            <Text style={{ color: "#0B1220", fontWeight: "900" }}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {err ? (
        <Text style={{ color: "salmon", paddingHorizontal: 12, paddingBottom: 8 }}>
          {err}
        </Text>
      ) : null}
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
