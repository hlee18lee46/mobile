// src/components/BasesDiamond.tsx
import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";

type Bases = { "1B": boolean; "2B": boolean; "3B": boolean };

type Props = {
  bases: Bases;
  size?: number;        // diamond side length
  gap?: number;         // space between bases
  showHome?: boolean;
  style?: ViewStyle;
  fillColor?: string;   // filled base color
  borderColor?: string; // outline color
};

export default function BasesDiamond({
  bases,
  size = 22,
  gap = 10,
  showHome = true,
  style,
  fillColor = "#fff",
  borderColor = "rgba(255,255,255,0.85)",
}: Props) {
  const Diamond = ({ filled }: { filled?: boolean }) => (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderColor,
          backgroundColor: filled ? fillColor : "transparent",
          transform: [{ rotate: "45deg" }],
        },
      ]}
    />
  );

  // overall square that fits a 2x2 diamond layout (+ gap)
  const box = { width: size * 2 + gap, height: size * 2 + gap };

  return (
    <View style={[styles.wrap, box, style]}>
      {/* 2B (top) */}
      <View style={[styles.cell, { top: 0, left: size / 2 + gap / 2 }]}>
        <Diamond filled={bases["2B"]} />
      </View>

      {/* 3B (left) */}
      <View style={[styles.cell, { top: size / 2 + gap / 2, left: 0 }]}>
        <Diamond filled={bases["3B"]} />
      </View>

      {/* 1B (right) */}
      <View style={[styles.cell, { top: size / 2 + gap / 2, left: size + gap }]}>
        <Diamond filled={bases["1B"]} />
      </View>

      {/* Home (bottom, visual only) */}
      {showHome && (
        <View style={[styles.cell, { top: size + gap, left: size / 2 + gap / 2 }]}>
          <Diamond />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "relative", alignSelf: "center" },
  cell: { position: "absolute", alignItems: "center", justifyContent: "center" },
  base: { borderWidth: 2, borderRadius: 3 },
});
