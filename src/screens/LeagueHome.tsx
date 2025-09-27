import React from "react";
import { SafeAreaView, View, Text, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import theme from "../theme";
import MLB from "./MLB";

type Props = NativeStackScreenProps<RootStackParamList, "LeagueHome">;

export default function LeagueHome({ route }: Props) {
  const { league } = route.params;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={styles.header}>
        <Text style={styles.title}>{league}</Text>
      </View>
      <View style={{ flex: 1 }}>
        {league === "MLB" ? (
          <MLB />
        ) : (
          <View style={styles.center}>
            <Text style={{ color: theme.colors.subtext }}>NFL coming next…</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16 },
  title: { color: theme.colors.text, fontSize: 24, fontWeight: "900" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
