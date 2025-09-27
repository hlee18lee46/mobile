// src/theme.ts
const theme = {
  colors: {
    bg: "#0B1220",
    primary: "#7C9BFF",
    text: "#EAF0FF",
    subtext: "rgba(234,240,255,0.7)",
    cardBorder: "rgba(255,255,255,0.12)",
  },
  radius: { xl: 20, xxl: 28 },
  spacing: (n: number) => n * 8,
  shadow: {
    card: {
      shadowColor: "#000",
      shadowOpacity: 0.25,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6, // Android
    },
  },
};
export default theme;
