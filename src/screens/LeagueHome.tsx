import React from "react";
import { SafeAreaView, View, Text, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import theme from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "LeagueHome">;

export default function LeagueHome({ route }: Props) {
  const { league } = route.params;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={styles.wrap}>
        <Text style={styles.heading}>{league}</Text>
        <Text style={styles.sub}>Live dashboard coming next…</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, justifyContent: "center" },
  heading: { color: theme.colors.text, fontSize: 28, fontWeight: "900", marginBottom: 8 },
  sub: { color: theme.colors.subtext },
});
