import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import theme from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Landing">;

export default function Landing({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrap}>
        <Text style={styles.title}>SportsNow</Text>
        <Text style={styles.sub}>Pick your league to get started.</Text>

        <Pressable
          style={[styles.btn, styles.btnBlue]}
          onPress={() => navigation.navigate("LeagueHome", { league: "MLB" })}
        >
          <Text style={styles.btnText}>MLB</Text>
        </Pressable>

        <Pressable
          style={[styles.btn, styles.btnRed]}
          onPress={() => navigation.navigate("LeagueHome", { league: "NFL" })}
        >
          <Text style={styles.btnText}>NFL</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  wrap: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  title: { color: theme.colors.text, fontSize: 28, fontWeight: "900", marginBottom: 8 },
  sub: { color: theme.colors.subtext, marginBottom: 24 },
  btn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    marginBottom: 12,
  },
  btnBlue: { backgroundColor: "#1E40AF" },
  btnRed: { backgroundColor: "#991B1B" },
  btnText: { color: "#fff", fontWeight: "800", letterSpacing: 0.5 },
});
