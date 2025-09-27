import React from "react";
import { View, StyleSheet } from "react-native";

type Bases = { "1B": boolean; "2B": boolean; "3B": boolean };

export default function BasesDiamond({ bases }: { bases: Bases }) {
  return (
    <View style={s.wrap}>
      {/* 2B (top) */}
      <View style={[s.base, s.b2, bases["2B"] && s.filled]} />
      {/* 1B (right) */}
      <View style={[s.base, s.b1, bases["1B"] && s.filled]} />
      {/* 3B (left) */}
      <View style={[s.base, s.b3, bases["3B"] && s.filled]} />
      {/* Home (bottom) outline only */}
      <View style={[s.base, s.home]} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    width: 100,
    height: 100,
    alignSelf: "center",
    transform: [{ rotate: "45deg" }],
  },
  base: {
    position: "absolute",
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: "white",
    backgroundColor: "transparent",
    borderRadius: 2,
  },
  filled: { backgroundColor: "white" },
  b2: { top: 2, left: 39 },
  b1: { bottom: 39, right: 2 },
  b3: { bottom: 39, left: 2 },
  home: { bottom: 2, left: 39 },
});
