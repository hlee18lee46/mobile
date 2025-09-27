// App.tsx
import * as React from "react";
import { StatusBar } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Landing from "./src/screens/Landing";
import LeagueHome from "./src/screens/LeagueHome";
import theme from "./src/theme";

export type RootStackParamList = {
  Landing: undefined;
  LeagueHome: { league: "MLB" | "NFL" };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.colors.bg,
      card: theme.colors.bg,
      primary: theme.colors.primary,
      text: theme.colors.text,
      border: "transparent",
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar barStyle="light-content" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Landing" component={Landing} />
        <Stack.Screen name="LeagueHome" component={LeagueHome} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
