import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function CountBox({
  balls = 0,
  strikes = 0,
  outs = 0,
}: {
  balls?: number;
  strikes?: number;
  outs?: number;
}) {
  return (
    <View style={s.row}>
      <Text style={s.item}>B: {balls}</Text>
      <Text style={s.item}>S: {strikes}</Text>
      <Text style={s.item}>O: {outs}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignSelf: "center" },
  item: { color: "#fff", fontWeight: "800", fontSize: 16, marginHorizontal: 8 },
});
