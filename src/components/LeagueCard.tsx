import React, { useRef, memo } from "react";
import {
  Pressable,
  View,
  Text,
  Animated,
  StyleSheet,
  ViewStyle,
} from "react-native";
import theme from "../theme";

type Props = {
  title: "MLB" | "NFL";
  subtitle?: string;
  // optional emoji badge instead of native icon libs
  badge?: string; // e.g., "⚾️" or "🏈"
  onPress: () => void;
  style?: ViewStyle;
};

function LeagueCard({ title, subtitle, badge, onPress, style }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (v: number) =>
    Animated.spring(scale, {
      toValue: v,
      useNativeDriver: true,
      friction: 7,
      tension: 80,
      // @ts-ignore (RN types)
      stiffness: 180,
    }).start();

  const shadowStyle = theme?.shadow?.card ? [theme.shadow.card] : [];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Select ${title}`}
      onPressIn={() => animateTo(0.96)}
      onPressOut={() => animateTo(1)}
      onPress={onPress}
      style={[styles.wrap, style]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <View style={[styles.card, ...shadowStyle]}>
          <View style={styles.leftBadge}>
            <Text style={styles.badgeText}>
              {badge ?? (title === "MLB" ? "⚾️" : "🏈")}
            </Text>
          </View>

          <View style={styles.middle}>
            <Text style={styles.title}>{title}</Text>
            {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>

          <Text style={styles.chev}>›</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  leftBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontSize: 22 },
  middle: { flex: 1, paddingHorizontal: 12 },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: 0.5,
  },
  subtitle: { color: theme.colors.subtext, marginTop: 2, fontSize: 13 },
  chev: { color: theme.colors.subtext, fontSize: 26, marginLeft: 8 },
});

export default memo(LeagueCard);
